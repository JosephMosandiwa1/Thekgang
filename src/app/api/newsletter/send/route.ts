import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/newsletter/send
 * Body: { campaign_id: number }
 *
 * Walks the campaign's list, creates newsletter_sends rows for each verified
 * subscriber, emails each one, records status. Idempotent via
 * UNIQUE(campaign_id, subscriber_id).
 */
export async function POST(req: NextRequest) {
  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const { data: campaign } = await supabase.from('newsletter_campaigns').select('*').eq('id', campaign_id).maybeSingle();
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    const c = campaign as { id: number; list_id: number | null; subject: string; html_body: string; text_body: string | null; status: string };

    if (c.status === 'sent' || c.status === 'sending') {
      return NextResponse.json({ error: 'Campaign already sent or in progress' }, { status: 409 });
    }

    await supabase.from('newsletter_campaigns').update({ status: 'sending' }).eq('id', c.id);

    // Build recipient list
    let recipientsQuery = supabase
      .from('newsletter_subscribers')
      .select('id, email, full_name, unsub_token')
      .eq('verified', true)
      .eq('unsubscribed', false);

    if (c.list_id) {
      const { data: subIds } = await supabase.from('newsletter_list_subscribers').select('subscriber_id').eq('list_id', c.list_id);
      const ids = ((subIds || []) as { subscriber_id: number }[]).map((r) => r.subscriber_id);
      if (ids.length === 0) {
        await supabase.from('newsletter_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: 0 }).eq('id', c.id);
        return NextResponse.json({ sent: 0 });
      }
      recipientsQuery = recipientsQuery.in('id', ids);
    }

    const { data: subs } = await recipientsQuery;
    const subscribers = (subs || []) as { id: number; email: string; full_name: string | null; unsub_token: string }[];

    const origin = req.nextUrl.origin;
    let sent = 0;
    let failed = 0;

    for (const s of subscribers) {
      // Insert send row (skip if duplicate)
      const { data: sendRow, error: insErr } = await supabase
        .from('newsletter_sends')
        .insert({ campaign_id: c.id, subscriber_id: s.id, status: 'pending' })
        .select('id')
        .single();
      if (insErr) continue;   // already queued

      const sendId = (sendRow as { id: number }).id;
      const unsubUrl = `${origin}/newsletter/unsubscribe/${s.unsub_token}`;
      const pixelUrl = `${origin}/api/newsletter/track/open/${sendId}`;
      const html = `${c.html_body}<br/><br/><img src="${pixelUrl}" width="1" height="1" style="display:none" alt=""/><p style="font-size:11px;color:#888;">You are receiving this because you subscribed to CDCC updates. <a href="${unsubUrl}">Unsubscribe</a>.</p>`;
      const text = `${c.text_body || stripTags(c.html_body)}\n\nUnsubscribe: ${unsubUrl}`;

      const result = await sendEmail({
        to: s.email,
        subject: c.subject,
        html,
        text,
        tags: { campaign: String(c.id) },
      });

      if (result.ok) {
        await supabase.from('newsletter_sends').update({ status: 'sent', sent_at: new Date().toISOString(), resend_message_id: result.id || null }).eq('id', sendId);
        sent++;
      } else {
        await supabase.from('newsletter_sends').update({ status: 'failed', error: result.error || null }).eq('id', sendId);
        failed++;
      }
    }

    await supabase.from('newsletter_campaigns').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: sent,
    }).eq('id', c.id);

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error('newsletter/send error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
