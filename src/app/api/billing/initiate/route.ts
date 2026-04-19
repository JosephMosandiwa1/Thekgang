import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { paystackPost, paystackSecret, type PaystackInitialiseResponse } from '@/lib/paystack';

/**
 * POST /api/billing/initiate
 * Body: { tier_slug: 'active' | 'patron' }
 *
 * Creates a pending member_payments row and returns a Paystack access_code
 * that the frontend uses to open the inline popup. Amount is taken from the
 * chosen tier's annual_fee_rands.
 */
export async function POST(req: NextRequest) {
  try {
    if (!paystackSecret()) {
      return NextResponse.json({ error: 'Paystack not configured on the server' }, { status: 501 });
    }
    const body = await req.json();
    const tierSlug: string = body?.tier_slug;
    if (!tierSlug) return NextResponse.json({ error: 'tier_slug required' }, { status: 400 });

    const supabase = await getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { data: member } = await supabase.from('members').select('id, email').eq('auth_user_id', user.id).maybeSingle();
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const { data: tier } = await supabase.from('member_tiers').select('*').eq('slug', tierSlug).maybeSingle();
    if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    const tierRow = tier as { id: number; slug: string; annual_fee_rands: number | string };
    const amountRands = Number(tierRow.annual_fee_rands) || 0;
    if (amountRands <= 0) return NextResponse.json({ error: 'Tier is free' }, { status: 400 });

    const memberRow = member as { id: number; email: string };
    const reference = `CDCC-${memberRow.id}-${tierRow.slug}-${Date.now().toString(36)}`;

    // Record the pending payment so we have an audit trail even if the user abandons
    await supabase.from('member_payments').insert({
      member_id: memberRow.id,
      tier_id: tierRow.id,
      amount_rands: amountRands,
      status: 'initiated',
      paystack_reference: reference,
      notes: `Annual ${tierRow.slug} subscription`,
    });

    // Initialise Paystack transaction (amount in KOBO/cents — *100)
    const init = await paystackPost<PaystackInitialiseResponse>('/transaction/initialize', {
      email: memberRow.email,
      amount: Math.round(amountRands * 100),
      currency: 'ZAR',
      reference,
      callback_url: `${req.nextUrl.origin}/portal/benefits?payment=success`,
      metadata: {
        member_id: memberRow.id,
        tier_slug: tierRow.slug,
        tier_id: tierRow.id,
      },
    });

    return NextResponse.json({
      access_code: init.data.access_code,
      reference: init.data.reference,
      authorization_url: init.data.authorization_url,
    });
  } catch (err) {
    console.error('billing/initiate error', err);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
