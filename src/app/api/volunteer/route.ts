import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { checkSpam } from '@/lib/spam';

/**
 * POST /api/volunteer
 * Public volunteer-signup endpoint. Replaces the prior client-direct-insert
 * pattern on /volunteer with honeypot + rate-limit + admin notification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, phone, interests = [], skills, availability } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const blocked = checkSpam(req, body, { route: '/api/volunteer', email });
    if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const { error: insertErr } = await supabase.from('volunteers').insert({
      full_name,
      email,
      phone: phone || null,
      interests,
      skills: typeof skills === 'string'
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ')
        : skills,
      availability: availability || null,
      status: 'new',
    });
    if (insertErr) {
      console.error('volunteer insert', insertErr);
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }

    // Notify the secretariat — fail loud if env var missing.
    const adminEmail = process.env.CDCC_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('volunteer: CDCC_ADMIN_EMAIL not configured');
    } else {
      await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `[Volunteer] ${full_name}`,
        text: `New volunteer signup:\n\nName: ${full_name}\nEmail: ${email}\nPhone: ${phone || '—'}\nInterests: ${(interests as string[]).join(', ') || '—'}\nSkills: ${skills || '—'}\nAvailability: ${availability || '—'}\n\nReview at /admin/inbox (volunteer source).`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('volunteer error', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
