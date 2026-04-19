import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { paystackPost, paystackSecret, type PaystackInitialiseResponse } from '@/lib/paystack';

/**
 * POST /api/tickets/initiate
 * Body: { event_id, ticket_type_id, quantity, buyer_name, buyer_email, buyer_phone? }
 *
 * Creates event_registration + event_ticket_purchase rows, calls Paystack,
 * returns access_code for inline popup.
 */
export async function POST(req: NextRequest) {
  try {
    if (!paystackSecret()) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 501 });
    }
    const { event_id, ticket_type_id, quantity = 1, buyer_name, buyer_email, buyer_phone } = await req.json();
    if (!event_id || !buyer_name || !buyer_email) {
      return NextResponse.json({ error: 'event_id, buyer_name, buyer_email required' }, { status: 400 });
    }
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    // Look up ticket type + event
    const { data: event } = await supabase.from('events').select('id, title, slug').eq('id', event_id).maybeSingle();
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    let price = 0;
    if (ticket_type_id) {
      const { data: tt } = await supabase.from('event_ticket_types').select('*').eq('id', ticket_type_id).maybeSingle();
      if (tt) price = Number((tt as { price_rands: number }).price_rands) || 0;
    }
    const amountRands = price * quantity;
    if (amountRands <= 0) return NextResponse.json({ error: 'Ticket is free — use regular registration' }, { status: 400 });

    const reference = `CDCC-TKT-${event_id}-${Date.now().toString(36)}`;
    const qrCode = `CDCC-${event_id}-${Date.now().toString(36)}`;

    // Create registration row
    const { data: reg } = await supabase.from('event_registrations').insert({
      event_id, name: buyer_name, email: buyer_email, phone: buyer_phone || null,
      qr_code: qrCode, waitlisted: false,
    }).select('id').single();

    await supabase.from('event_ticket_purchases').insert({
      event_id,
      ticket_type_id,
      registration_id: (reg as { id: number } | null)?.id,
      buyer_name, buyer_email, buyer_phone: buyer_phone || null,
      quantity, amount_rands: amountRands,
      status: 'initiated',
      paystack_reference: reference,
    });

    const init = await paystackPost<PaystackInitialiseResponse>('/transaction/initialize', {
      email: buyer_email,
      amount: Math.round(amountRands * 100),
      currency: 'ZAR',
      reference,
      callback_url: `${req.nextUrl.origin}/events/${(event as { slug: string | null; id: number }).slug || event_id}?payment=success`,
      metadata: {
        kind: 'ticket',
        event_id,
        ticket_type_id: ticket_type_id || null,
        registration_id: (reg as { id: number } | null)?.id,
      },
    });

    return NextResponse.json({
      access_code: init.data.access_code,
      reference: init.data.reference,
      authorization_url: init.data.authorization_url,
    });
  } catch (err) {
    console.error('tickets/initiate error', err);
    return NextResponse.json({ error: 'Failed to initiate ticket purchase' }, { status: 500 });
  }
}
