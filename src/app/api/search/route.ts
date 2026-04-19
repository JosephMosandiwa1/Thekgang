import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchRow {
  kind: string;
  id: number;
  slug: string | null;
  title: string;
  snippet: string | null;
  extra: Record<string, unknown> | null;
  rank: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const kindFilter = req.nextUrl.searchParams.get('kind')?.trim();
  const disciplineFilter = req.nextUrl.searchParams.get('discipline')?.trim();
  const languageFilter = req.nextUrl.searchParams.get('language')?.trim();

  if (!q || q.length < 2) {
    return Response.json({ results: [], grouped: {}, total: 0 });
  }

  const sb = getSupabase();
  if (!sb) return Response.json({ results: [], grouped: {}, total: 0 });

  const { data, error } = await sb.rpc('unified_search', { q, lim: 20 });

  if (error) {
    // Fallback to ilike search if RPC missing (e.g. migration not yet applied)
    const pattern = `%${q}%`;
    const [{ data: posts }, { data: events }] = await Promise.all([
      sb.from('posts').select('id, slug, title, meta_description, category, published_at')
        .eq('status', 'published')
        .or(`title.ilike.${pattern},meta_description.ilike.${pattern}`)
        .limit(10),
      sb.from('events').select('id, title, event_date, venue, description')
        .neq('status', 'draft')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(10),
    ]);
    const fallback: SearchRow[] = [
      ...(posts ?? []).map((p) => {
        const row = p as { id: number; slug: string; title: string; meta_description: string | null; category: string | null; published_at: string };
        return {
          kind: 'post', id: row.id, slug: row.slug, title: row.title,
          snippet: row.meta_description, extra: { category: row.category, published_at: row.published_at }, rank: 0.1,
        };
      }),
      ...(events ?? []).map((e) => {
        const row = e as { id: number; title: string; event_date: string; venue: string | null; description: string | null };
        return {
          kind: 'event', id: row.id, slug: null, title: row.title,
          snippet: row.description, extra: { event_date: row.event_date, venue: row.venue }, rank: 0.1,
        };
      }),
    ];
    return Response.json({ results: fallback, grouped: groupByKind(fallback), total: fallback.length, fallback: true });
  }

  let rows = (data ?? []) as SearchRow[];

  if (kindFilter) rows = rows.filter((r) => r.kind === kindFilter);
  if (disciplineFilter) {
    rows = rows.filter((r) => {
      const d = r.extra?.discipline;
      return typeof d === 'string' && d === disciplineFilter;
    });
  }
  if (languageFilter) {
    rows = rows.filter((r) => {
      const l = r.extra?.language;
      return typeof l === 'string' && l === languageFilter;
    });
  }

  return Response.json({
    results: rows,
    grouped: groupByKind(rows),
    total: rows.length,
  });
}

function groupByKind(rows: SearchRow[]): Record<string, SearchRow[]> {
  const out: Record<string, SearchRow[]> = {};
  for (const r of rows) {
    if (!out[r.kind]) out[r.kind] = [];
    out[r.kind].push(r);
  }
  return out;
}
