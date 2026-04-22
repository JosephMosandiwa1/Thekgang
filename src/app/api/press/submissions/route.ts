/**
 * POST /api/press/submissions
 * Accepts a filled form payload from a public /f/[slug] page.
 *
 * Validates the form is published + within its open/close window.
 * Inserts a row into press_submissions with state='received'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  }

  let body: { form_id?: string; payload?: Record<string, unknown>; source_url?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
  if (!body?.form_id || !body.payload) {
    return NextResponse.json({ ok: false, error: 'Missing form_id or payload' }, { status: 400 });
  }

  const admin = createClient(url, serviceKey);

  const { data: form, error: formErr } = await admin
    .from('press_forms')
    .select('id, status, opens_at, closes_at, route_to_user_id, notify_emails')
    .eq('id', body.form_id)
    .maybeSingle();

  if (formErr || !form) {
    return NextResponse.json({ ok: false, error: 'Form not found' }, { status: 404 });
  }
  if (form.status !== 'published') {
    return NextResponse.json({ ok: false, error: 'Form not published' }, { status: 403 });
  }

  const now = new Date();
  if (form.opens_at && new Date(form.opens_at) > now) {
    return NextResponse.json({ ok: false, error: 'Form not yet open' }, { status: 403 });
  }
  if (form.closes_at && new Date(form.closes_at) < now) {
    return NextResponse.json({ ok: false, error: 'Form closed' }, { status: 403 });
  }

  const userAgent = req.headers.get('user-agent') ?? '';
  const submitterEmail = (body.payload.email as string | undefined) ?? null;
  const submitterName = (body.payload.full_name as string | undefined) ?? (body.payload.name as string | undefined) ?? null;

  const { data: sub, error: subErr } = await admin.from('press_submissions').insert({
    form_id: form.id,
    payload: body.payload,
    state: 'received',
    submitter_email: submitterEmail,
    submitter_name: submitterName,
    source_url: body.source_url ?? null,
    user_agent: userAgent,
    assigned_to: form.route_to_user_id,
  }).select('id').single();

  if (subErr || !sub) {
    return NextResponse.json({ ok: false, error: subErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submission_id: sub.id });
}
