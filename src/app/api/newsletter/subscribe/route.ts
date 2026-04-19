import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, full_name, phone, disciplines = [], province, source = 'public', lists = ['general'] } = body;
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const verifyToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const unsubToken = Math.random().toString(36).slice(2) + Date.now().toString(36);

    const { data: existing } = await supabase.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle();
    let subscriberId: number;
    if (existing) {
      await supabase.from('newsletter_subscribers').update({
        full_name: full_name || null,
        phone: phone || null,
        disciplines,
        province: province || null,
        unsubscribed: false,
        unsubscribed_at: null,
      }).eq('id', (existing as { id: number }).id);
      subscriberId = (existing as { id: number }).id;
    } else {
      const { data: inserted } = await supabase.from('newsletter_subscribers').insert({
        email, full_name, phone, disciplines, province, source,
        verify_token: verifyToken, unsub_token: unsubToken,
      }).select('id').single();
      subscriberId = (inserted as { id: number }).id;
    }

    // Link to chosen lists
    const { data: listRows } = await supabase.from('newsletter_lists').select('id, slug').in('slug', lists);
    for (const l of (listRows || []) as { id: number; slug: string }[]) {
      await supabase.from('newsletter_list_subscribers').upsert({ list_id: l.id, subscriber_id: subscriberId });
    }

    // Send verify email (skipped gracefully if RESEND_API_KEY unset)
    const origin = req.nextUrl.origin;
    const verifyUrl = `${origin}/newsletter/verify/${verifyToken}`;
    await sendEmail({
      to: email,
      subject: 'Confirm your Council subscription',
      text: `Click to confirm your subscription:\n\n${verifyUrl}\n\n— CDCC`,
      html: `<p>Thanks for subscribing. Please confirm your email by clicking below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>— CDCC</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('newsletter/subscribe error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
