import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { verifyWebhookSignature, type PaystackTxn } from '@/lib/paystack';

export const runtime = 'nodejs';

/**
 * POST /api/billing/webhook
 *
 * Paystack calls this on every transaction event. We:
 *   1. Verify the x-paystack-signature header
 *   2. Log the raw event into paystack_events
 *   3. On charge.success, update member_payments + activate member_subscriptions
 *
 * Point Paystack webhook settings at: <your-domain>/api/billing/webhook
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';

  const ok = await verifyWebhookSignature(rawBody, signature);
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let payload: { event: string; data: PaystackTxn };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  // Log raw event
  const { data: eventRow } = await supabase
    .from('paystack_events')
    .insert({
      event_type: payload.event,
      paystack_reference: payload.data?.reference,
      payload,
    })
    .select('id')
    .single();

  try {
    if (payload.event === 'charge.success') {
      const txn = payload.data;
      const amountRands = txn.amount / 100;
      const kind = (txn.metadata as { kind?: string })?.kind;

      // Ticket purchases route through a different table
      if (kind === 'ticket') {
        await supabase.from('event_ticket_purchases').update({
          status: 'paid',
          paystack_transaction_id: String(txn.id),
          paid_at: txn.paid_at || new Date().toISOString(),
          raw_response: txn as unknown as Record<string, unknown>,
        }).eq('paystack_reference', txn.reference);
        if (eventRow) {
          await supabase.from('paystack_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', (eventRow as { id: number }).id);
        }
        return NextResponse.json({ received: true });
      }

      const memberId = Number((txn.metadata as { member_id?: number })?.member_id);
      const tierId = Number((txn.metadata as { tier_id?: number })?.tier_id);

      // Update the initiated payment row
      const { data: paymentRow } = await supabase
        .from('member_payments')
        .update({
          status: 'success',
          paystack_transaction_id: String(txn.id),
          channel: txn.channel,
          paid_at: txn.paid_at || new Date().toISOString(),
          raw_response: txn as unknown as Record<string, unknown>,
        })
        .eq('paystack_reference', txn.reference)
        .select('id')
        .single();

      // Activate / extend subscription
      if (memberId && tierId) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const { data: existing } = await supabase
          .from('member_subscriptions')
          .select('id, expires_at')
          .eq('member_id', memberId)
          .maybeSingle();

        const startedAt = (existing as { expires_at?: string } | null)?.expires_at
          ? new Date((existing as { expires_at: string }).expires_at)
          : now;
        const newExpires = new Date(Math.max(startedAt.getTime(), now.getTime()) + 365 * 24 * 60 * 60 * 1000);

        const subRecord = {
          member_id: memberId,
          tier_id: tierId,
          status: 'active',
          started_at: (existing as { id?: number } | null) ? undefined : now.toISOString().split('T')[0],
          expires_at: newExpires.toISOString().split('T')[0],
          next_renewal_at: newExpires.toISOString().split('T')[0],
          last_payment_at: now.toISOString(),
          last_payment_id: (paymentRow as { id: number } | null)?.id,
          paystack_customer_code: txn.customer?.customer_code,
          paystack_authorization_code: txn.authorization?.authorization_code,
          auto_renew: true,
        };

        if (existing) {
          await supabase.from('member_subscriptions').update(subRecord).eq('id', (existing as { id: number }).id);
        } else {
          await supabase.from('member_subscriptions').insert({ ...subRecord, started_at: now.toISOString().split('T')[0] });
        }

        // Also flip the member's tier to the paid tier
        await supabase.from('members').update({ tier_id: tierId, status: 'active' }).eq('id', memberId);
      }

      // ignored amountRands unused-var warning — keeping for future reconciliation
      void amountRands;
    }

    if (eventRow) {
      await supabase.from('paystack_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', (eventRow as { id: number }).id);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('webhook handler error', err);
    if (eventRow) {
      await supabase.from('paystack_events').update({ error: String(err) }).eq('id', (eventRow as { id: number }).id);
    }
    return NextResponse.json({ received: true, error: 'Handler failed' });
  }
}
