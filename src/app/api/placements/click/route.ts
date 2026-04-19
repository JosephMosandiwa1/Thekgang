import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const placementId = Number(body.placement_id);
    const event = body.event === 'dismiss' ? 'dismiss' : 'click';
    if (!placementId) return NextResponse.json({ ok: false }, { status: 400 });
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

    const { data: p } = await supabase.from('placements').select('clicks_count, dismiss_count').eq('id', placementId).maybeSingle();
    if (p) {
      const row = p as { clicks_count: number; dismiss_count: number };
      const patch: Record<string, number> = {};
      if (event === 'click') patch.clicks_count = (row.clicks_count || 0) + 1;
      if (event === 'dismiss') patch.dismiss_count = (row.dismiss_count || 0) + 1;
      await supabase.from('placements').update(patch).eq('id', placementId);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
