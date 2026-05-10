import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { renderWelcomeEmail } from '@/lib/mail/templates/welcome';
import { checkSpam } from '@/lib/spam';

/**
 * POST /api/join
 * Public membership application endpoint.
 *
 * Closes the audit gap on /join · the page used to insert directly to
 * Supabase from the client with no notification, no admin alert, and no
 * spam protection. This route adds:
 *   - honeypot + rate-limit
 *   - POPIA consent enforcement
 *   - applicant confirmation email ("Application received")
 *   - admin notification to CDCC_ADMIN_EMAIL
 *   - status set to 'pending_review' so the inbox surfaces it
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, phone, province, type, organisation,
      languages = [], specialisation, bio, popia_consent,
    } = body;

    if (!name || !email || !type) {
      return NextResponse.json({ error: 'name, email, role-in-value-chain are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!popia_consent) {
      return NextResponse.json({ error: 'POPIA consent is required to submit your application' }, { status: 400 });
    }

    const blocked = checkSpam(req, body, { route: '/api/join', email });
    if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const { error: insertErr } = await supabase
      .from('constituency_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        province: province || null,
        constituency_type: type,
        organisation: organisation || null,
        languages,
        specialisation: specialisation || null,
        bio: bio || null,
        status: 'pending_review',
      });

    if (insertErr) {
      console.error('join insert error', insertErr);
      return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
    }

    // Applicant confirmation · branded HTML via the welcome template
    const welcome = renderWelcomeEmail({
      name,
      variant: 'applicant',
      province,
    });
    await sendEmail({
      to: email,
      subject: 'Your CDCC membership application has been received',
      html: welcome.html,
      text: welcome.text,
    });

    // Admin notification
    const adminEmail = process.env.CDCC_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('join: CDCC_ADMIN_EMAIL not configured · admin will not be notified of new application');
    } else {
      await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `[CDCC] New membership application · ${name} · ${province || 'no province'}`,
        text: `New CDCC membership application:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nProvince: ${province || '—'}\nRole: ${type}\nOrganisation: ${organisation || '—'}\nLanguages: ${(languages as string[]).join(', ') || '—'}\nSpecialisation: ${specialisation || '—'}\n\nBio:\n${bio || '—'}\n\nReview at: https://cdcc.org.za/admin/inbox`,
        html: `<h2>New CDCC membership application</h2>
          <table cellspacing="0" cellpadding="6" border="0" style="font-family:sans-serif;font-size:13px;">
            <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
            <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone || '—')}</td></tr>
            <tr><td><strong>Province</strong></td><td>${escapeHtml(province || '—')}</td></tr>
            <tr><td><strong>Role</strong></td><td>${escapeHtml(type)}</td></tr>
            <tr><td><strong>Organisation</strong></td><td>${escapeHtml(organisation || '—')}</td></tr>
            <tr><td><strong>Languages</strong></td><td>${escapeHtml((languages as string[]).join(', ') || '—')}</td></tr>
            <tr><td><strong>Specialisation</strong></td><td>${escapeHtml(specialisation || '—')}</td></tr>
          </table>
          <p><strong>Bio</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(bio || '—')}</p>
          <p><a href="https://cdcc.org.za/admin/inbox">Review in /admin/inbox →</a></p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('join error', err);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
