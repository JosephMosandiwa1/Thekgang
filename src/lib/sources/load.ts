/**
 * Server-side loaders for the source-attribution system.
 *
 * Usage from Server Components / Route Handlers:
 *
 *   const facts = await loadSurface('homepage.social_proof');
 *   const allSources = await loadAllSources();
 *   const source = await loadSourceBySlug('cdcc-self');
 *   const media = await loadMedia(uuid);
 *
 * Returns plain shapes from `./types.ts` so the components consume
 * them without knowing about Supabase.
 */

import 'server-only';
import { getSupabase } from '@/lib/supabase/server';
import type { ContentFact, MediaRef, SourceRef } from './types';

interface SourceRow {
  id: string;
  slug: string;
  label: string;
  publisher: string;
  url: string | null;
  kind: SourceRef['kind'];
  published_at: string | null;
  retrieved_at: string | null;
  notes: string | null;
  status: SourceRef['status'];
}

interface ContentFactRow {
  id: string;
  surface: string;
  position: number;
  value: string;
  label: string;
  why_here: string | null;
  context: string | null;
  source_id: string;
  href: string;
  status: SourceRef['status'];
  is_active: boolean;
}

interface MediaRow {
  id: string;
  file_url: string;
  alt_text: string | null;
  photographer: string | null;
  source_id: string | null;
  license: string | null;
  caption: string | null;
}

function rowToSource(row: SourceRow): SourceRef {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    publisher: row.publisher,
    url: row.url,
    kind: row.kind,
    publishedAt: row.published_at,
    retrievedAt: row.retrieved_at,
    notes: row.notes,
    status: row.status,
  };
}

/**
 * Load all published facts for a given surface key, in display order.
 * Returns [] if Supabase is unavailable or the surface is empty.
 */
export async function loadSurface(surface: string): Promise<ContentFact[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('content_facts')
    .select(`
      id, surface, position, value, label, why_here, context, source_id, href, status, is_active,
      sources:source_id ( id, slug, label, publisher, url, kind, published_at, retrieved_at, notes, status )
    `)
    .eq('surface', surface)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('position');

  if (error || !data) return [];

  return (data as unknown as Array<ContentFactRow & { sources: SourceRow }>)
    .filter((row) => row.sources)
    .map((row) => ({
      id: row.id,
      surface: row.surface,
      position: row.position,
      value: row.value,
      label: row.label,
      whyHere: row.why_here,
      context: row.context,
      source: rowToSource(row.sources),
      href: row.href,
      status: row.status,
      isActive: row.is_active,
    }));
}

/** Load a single source by its slug · null if missing. */
export async function loadSourceBySlug(slug: string): Promise<SourceRef | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('sources')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSource(data as SourceRow);
}

/** Load all published sources (for /evidence). */
export async function loadAllPublishedSources(): Promise<SourceRef[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('sources')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return (data as SourceRow[]).map(rowToSource);
}

/** Load a single media-library entry with its source attached. Null if missing or sourceless. */
export async function loadMedia(id: string): Promise<MediaRef | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('media_library')
    .select(`
      id, file_url, alt_text, photographer, source_id, license, caption,
      sources:source_id ( id, slug, label, publisher, url, kind, published_at, retrieved_at, notes, status )
    `)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as MediaRow & { sources: SourceRow | null };
  if (!row.sources || !row.photographer || !row.license) return null;
  return {
    id: row.id,
    url: row.file_url,
    alt: row.alt_text ?? '',
    photographer: row.photographer,
    source: rowToSource(row.sources),
    license: row.license as MediaRef['license'],
    caption: row.caption,
  };
}

/**
 * Convenience: extract distinct SourceRefs from a list of facts.
 * Useful for `<SourceStrip sources={...} />` at page level.
 */
export function distinctSources(facts: ContentFact[]): SourceRef[] {
  const seen = new Map<string, SourceRef>();
  for (const f of facts) {
    if (!seen.has(f.source.id)) seen.set(f.source.id, f.source);
  }
  return Array.from(seen.values());
}
