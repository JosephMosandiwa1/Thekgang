import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return Response.json({ posts: [], events: [], pages: [] });
  }

  const sb = getSupabase();
  if (!sb) return Response.json({ posts: [], events: [], pages: [] });

  const pattern = `%${q}%`;

  const [{ data: posts }, { data: events }, { data: pages }] = await Promise.all([
    sb.from('posts')
      .select('id, slug, title, category, meta_description, published_at')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},content.ilike.${pattern},meta_description.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(10),
    sb.from('events')
      .select('id, slug, title, event_date, venue, description')
      .neq('status', 'draft')
      .or(`title.ilike.${pattern},description.ilike.${pattern},venue.ilike.${pattern}`)
      .order('event_date', { ascending: false })
      .limit(10),
    sb.from('pages')
      .select('id, slug, title, meta_description')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
  ]);

  return Response.json({
    posts: posts ?? [],
    events: events ?? [],
    pages: pages ?? [],
  });
}
