import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consultation_id, respondent_name, respondent_email, organisation, position_stance, response_text, public: isPublic, signed_on } = body;
    if (!consultation_id || !respondent_name || !respondent_email || !response_text) {
      return NextResponse.json({ error: 'consultation_id, respondent_name, respondent_email, response_text required' }, { status: 400 });
    }
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    const { error } = await supabase.from('consultation_responses').insert({
      consultation_id,
      respondent_name, respondent_email,
      organisation: organisation || null,
      position_stance: position_stance || null,
      response_text,
      public: !!isPublic,
      signed_on: !!signed_on,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Increment response count
    const { data: consult } = await supabase.from('consultations').select('response_count, sign_on_count').eq('id', consultation_id).maybeSingle();
    if (consult) {
      await supabase.from('consultations').update({
        response_count: ((consult as { response_count: number }).response_count || 0) + 1,
        sign_on_count: ((consult as { sign_on_count: number }).sign_on_count || 0) + (signed_on ? 1 : 0),
      }).eq('id', consultation_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
