import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, topic } = body;
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'name, email, message required' }, { status: 400 });
    }
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

    // Notify admin secretariat
    const adminEmail = process.env.CDCC_ADMIN_EMAIL || 'hello@cdcc.org.za';
    await sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: `[Contact] ${subject || topic || 'New enquiry'} — ${name}`,
      text: `From: ${name} <${email}>${phone ? `\nPhone: ${phone}` : ''}\nTopic: ${topic || 'general'}\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p>${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}<p><strong>Topic:</strong> ${topic || 'general'}</p><hr/><p style="white-space:pre-wrap">${message}</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
