import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const placementId = Number(body.placement_id);
    if (!placementId) return NextResponse.json({ ok: false }, { status: 400 });
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });
    const { data: p } = await supabase.from('placements').select('views_count').eq('id', placementId).maybeSingle();
    if (p) {
      await supabase.from('placements').update({ views_count: ((p as { views_count: number }).views_count || 0) + 1 }).eq('id', placementId);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
