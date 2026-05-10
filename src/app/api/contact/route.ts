import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { checkSpam } from '@/lib/spam';
import { renderContactNotificationEmail } from '@/lib/mail/templates/contact-notification';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, topic, popia_consent } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'name, email, message required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!popia_consent) {
      return NextResponse.json({ error: 'POPIA consent is required' }, { status: 400 });
    }

    const blocked = checkSpam(req, body, { route: '/api/contact', email });
    if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    await supabase.from('contact_submissions').insert({
      name, email,
      phone: phone || null,
      subject: subject || null,
      message,
      topic: topic || 'general',
      source_url: req.headers.get('referer') || null,
      status: 'new',
    });

    // Notify admin secretariat. Fail loud if env var missing — silently
    // routing to a placeholder address (the prior behaviour) hid lost
    // submissions. Operators must set CDCC_ADMIN_EMAIL or know nothing
    // gets through.
    const adminEmail = process.env.CDCC_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('contact submission saved but CDCC_ADMIN_EMAIL is not configured · admin will not be notified');
    } else {
      const rendered = renderContactNotificationEmail({
        name, email, phone, topic, subject, message,
      });
      await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `[Contact] ${subject || topic || 'New enquiry'} — ${name}`,
        text: rendered.text,
        html: rendered.html,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
