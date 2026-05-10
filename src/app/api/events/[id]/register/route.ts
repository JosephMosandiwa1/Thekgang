import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';
import { checkSpam } from '@/lib/spam';

/**
 * POST /api/events/[id]/register
 * Public event-RSVP endpoint. Replaces direct supabase.from(...).insert
 * from /events/[id] with honeypot + rate-limit + capacity-aware
 * waitlist + optional registry-join in one server-side flow.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const { name, email, phone, organisation, province, joinRegistry } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const blocked = checkSpam(req, body, { route: '/api/events/register', email });
    if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    // Resolve event by id or slug, get capacity for waitlist check.
    type EventRow = { id: number; slug: string | null; capacity: number | null };
    let event: EventRow | null = null;
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const r = await supabase.from('events').select('id, slug, capacity').eq('id', numId).maybeSingle();
      if (r.data) event = r.data as EventRow;
    }
    if (!event) {
      const r = await supabase.from('events').select('id, slug, capacity').eq('slug', id).maybeSingle();
      if (r.data) event = r.data as EventRow;
    }
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    let waitlisted = false;
    if (event.capacity) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id);
      waitlisted = (count ?? 0) >= event.capacity;
    }

    const qrCode = `CDCC-${event.id}-${Date.now().toString(36)}`;
    const { error: regErr } = await supabase.from('event_registrations').insert({
      event_id: event.id,
      name,
      email,
      phone: phone || null,
      organisation: organisation || null,
      province: province || null,
      qr_code: qrCode,
      waitlisted,
      status: 'new',
    });
    if (regErr) {
      console.error('event registration insert', regErr);
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    if (joinRegistry) {
      await supabase.from('constituency_submissions').insert({
        name,
        email,
        phone: phone || null,
        province: province || null,
        organisation: organisation || null,
        constituency_type: 'other',
        status: 'new',
        utm_source: 'event_registration',
        utm_campaign: event.slug || String(event.id),
      });
    }

    return NextResponse.json({ ok: true, waitlisted, qrCode });
  } catch (err) {
    console.error('event register error', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
