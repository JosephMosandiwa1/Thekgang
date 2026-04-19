import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

/**
 * GET /api/onix/[isbn]
 * Public endpoint for partner integrations — returns an ONIX record as JSON
 * keyed by ISBN-13.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = await params;
  const cleaned = isbn.replace(/[^0-9X]/gi, '');
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { data } = await supabase
    .from('onix_records')
    .select('*, books:book_id(title, subtitle, author_names, publisher_name, published_date)')
    .eq('isbn', cleaned)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
