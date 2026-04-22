/**
 * POST /api/press/voices/publish-due
 *
 * Scheduled publisher. Flips every Voice whose `state = 'ready'` and
 * `scheduled_at <= now()` into `state = 'live'`. Stamps published_at
 * via the state-transition trigger.
 *
 * Intended to run on a cron (Vercel cron or Supabase pg_cron), once
 * an hour. Protected by PRESS_CRON_SECRET header so random callers
 * can't trigger it.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.PRESS_CRON_SECRET;
  const header = req.headers.get('x-press-cron-secret');
  if (!secret || header !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('press_voices')
    .update({ state: 'live', published_at: nowIso })
    .eq('state', 'ready')
    .lte('scheduled_at', nowIso)
    .select('id, slug, scheduled_at');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0, published: data ?? [] });
}

export function GET() {
  return NextResponse.json({ ok: false, hint: 'POST with x-press-cron-secret header' }, { status: 405 });
}
