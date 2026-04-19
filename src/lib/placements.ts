/**
 * Placements — the WordPress-widgets layer.
 *
 * A placement row says "content kind X with ref_id Y should appear at slot Z
 * in style S". The resolver walks this polymorphic reference and builds a
 * displayable payload (eyebrow, title, subtitle, image, CTA) which the
 * style components render.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export type PlacementStyle =
  | 'full_takeover'
  | 'hero'
  | 'card'
  | 'banner'
  | 'ticker'
  | 'callout'
  | 'modal'
  | 'cta_strip';

export type ContentKind =
  | 'event' | 'book' | 'job' | 'award' | 'consultation'
  | 'post' | 'press_release' | 'podcast' | 'grant'
  | 'reading_challenge' | 'banned_book' | 'programme'
  | 'page' | 'organisation' | 'working_group' | 'custom';

export interface PlacementRow {
  id: number;
  slot_id: number;
  content_kind: ContentKind;
  ref_id: number | null;
  custom_html: string | null;
  override_eyebrow: string | null;
  override_title: string | null;
  override_subtitle: string | null;
  override_body: string | null;
  override_image_url: string | null;
  override_cta_text: string | null;
  override_cta_url: string | null;
  style: PlacementStyle;
  theme: 'light' | 'dark' | 'brand' | 'paper' | 'accent';
  background_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  text_align: 'left' | 'center' | 'right';
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  frequency: string;
  views_count: number;
  clicks_count: number;
}

export interface DisplayPayload {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_text: string;
  cta_url: string;
  source_type: ContentKind;
  source_id: number | null;
}

/**
 * Fetch live placements for a given slot slug, ordered by priority desc.
 * Used by server components. Returns empty array if slot unknown.
 */
export async function fetchLivePlacements(
  supabase: SupabaseClient,
  slotSlug: string,
  limit = 5
): Promise<PlacementRow[]> {
  const { data: slot } = await supabase.from('placement_slots').select('id, max_concurrent').eq('slug', slotSlug).maybeSingle();
  if (!slot) return [];
  const slotRow = slot as { id: number; max_concurrent: number };

  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('placements')
    .select('*')
    .eq('slot_id', slotRow.id)
    .eq('status', 'live')
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order('priority', { ascending: false })
    .limit(Math.min(limit, slotRow.max_concurrent));
  return ((data || []) as unknown) as PlacementRow[];
}

/**
 * Given a placement row, fetch the underlying content and build a display payload.
 * Falls back to override_* fields where provided.
 */
export async function resolvePlacement(
  supabase: SupabaseClient,
  p: PlacementRow
): Promise<DisplayPayload | null> {
  // Custom HTML kind — title optional, overrides carry everything
  if (p.content_kind === 'custom') {
    return {
      eyebrow: p.override_eyebrow,
      title: p.override_title || 'Announcement',
      subtitle: p.override_subtitle,
      body: p.override_body || p.custom_html,
      image_url: p.override_image_url,
      cta_text: p.override_cta_text || 'Learn more',
      cta_url: p.override_cta_url || '#',
      source_type: 'custom',
      source_id: null,
    };
  }

  if (!p.ref_id) return null;

  // Polymorphic fetch per content kind
  const resolvers: Record<Exclude<ContentKind, 'custom'>, () => Promise<DisplayPayload | null>> = {
    event: async () => {
      const { data: e } = await supabase.from('events').select('id, title, slug, tagline, event_date, venue, cover_image_url, description').eq('id', p.ref_id).maybeSingle();
      if (!e) return null;
      const r = e as { id: number; title: string; slug: string | null; tagline: string | null; event_date: string; venue: string | null; cover_image_url: string | null; description: string | null };
      return {
        eyebrow: p.override_eyebrow ?? `Event · ${new Date(r.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}`,
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.tagline,
        body: p.override_body ?? (r.venue ? `${r.venue} · ${new Date(r.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}` : null),
        image_url: p.override_image_url ?? r.cover_image_url,
        cta_text: p.override_cta_text ?? 'View event',
        cta_url: p.override_cta_url ?? `/events/${r.slug || r.id}`,
        source_type: 'event', source_id: r.id,
      };
    },
    book: async () => {
      const { data: b } = await supabase.from('books').select('id, title, subtitle, author_names, cover_image_url, description, isbn').eq('id', p.ref_id).maybeSingle();
      if (!b) return null;
      const r = b as { id: number; title: string; subtitle: string | null; author_names: string[]; cover_image_url: string | null; description: string | null; isbn: string | null };
      return {
        eyebrow: p.override_eyebrow ?? 'Book',
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? (r.author_names.length > 0 ? `by ${r.author_names.join(', ')}` : r.subtitle),
        body: p.override_body ?? r.description,
        image_url: p.override_image_url ?? r.cover_image_url,
        cta_text: p.override_cta_text ?? 'View in catalogue',
        cta_url: p.override_cta_url ?? `/books`,
        source_type: 'book', source_id: r.id,
      };
    },
    job: async () => {
      const { data: j } = await supabase.from('jobs').select('id, slug, title, employer_name, description, closes_at').eq('id', p.ref_id).maybeSingle();
      if (!j) return null;
      const r = j as { id: number; slug: string | null; title: string; employer_name: string; description: string | null; closes_at: string | null };
      return {
        eyebrow: p.override_eyebrow ?? 'Hiring',
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.employer_name,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'View job',
        cta_url: p.override_cta_url ?? `/jobs/${r.slug || r.id}`,
        source_type: 'job', source_id: r.id,
      };
    },
    award: async () => {
      const { data: a } = await supabase.from('awards').select('id, slug, name, description, category').eq('id', p.ref_id).maybeSingle();
      if (!a) return null;
      const r = a as { id: number; slug: string; name: string; description: string | null; category: string | null };
      return {
        eyebrow: p.override_eyebrow ?? `Award${r.category ? ` · ${r.category}` : ''}`,
        title: p.override_title ?? r.name,
        subtitle: p.override_subtitle,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'About the award',
        cta_url: p.override_cta_url ?? `/awards`,
        source_type: 'award', source_id: r.id,
      };
    },
    consultation: async () => {
      const { data: c } = await supabase.from('consultations').select('id, slug, title, subject, closes_at').eq('id', p.ref_id).maybeSingle();
      if (!c) return null;
      const r = c as { id: number; slug: string; title: string; subject: string | null; closes_at: string | null };
      return {
        eyebrow: p.override_eyebrow ?? 'Policy consultation',
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.subject,
        body: p.override_body ?? (r.closes_at ? `Closes ${new Date(r.closes_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}` : null),
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Add your voice',
        cta_url: p.override_cta_url ?? `/consultations/${r.slug}`,
        source_type: 'consultation', source_id: r.id,
      };
    },
    post: async () => {
      const { data: pp } = await supabase.from('posts').select('id, slug, title, meta_description, category, published_at').eq('id', p.ref_id).maybeSingle();
      if (!pp) return null;
      const r = pp as { id: number; slug: string; title: string; meta_description: string | null; category: string | null; published_at: string | null };
      return {
        eyebrow: p.override_eyebrow ?? (r.category || 'News'),
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.meta_description,
        body: p.override_body,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Read more',
        cta_url: p.override_cta_url ?? `/news/${r.slug}`,
        source_type: 'post', source_id: r.id,
      };
    },
    press_release: async () => {
      const { data: pr } = await supabase.from('press_releases').select('id, slug, title, summary, topic').eq('id', p.ref_id).maybeSingle();
      if (!pr) return null;
      const r = pr as { id: number; slug: string; title: string; summary: string | null; topic: string | null };
      return {
        eyebrow: p.override_eyebrow ?? (r.topic ? `Press · ${r.topic}` : 'Press release'),
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.summary,
        body: p.override_body,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Read release',
        cta_url: p.override_cta_url ?? `/press/${r.slug}`,
        source_type: 'press_release', source_id: r.id,
      };
    },
    podcast: async () => {
      const { data: pd } = await supabase.from('podcast_episodes').select('id, slug, title, description, season, episode_number').eq('id', p.ref_id).maybeSingle();
      if (!pd) return null;
      const r = pd as { id: number; slug: string | null; title: string; description: string | null; season: number | null; episode_number: number | null };
      return {
        eyebrow: p.override_eyebrow ?? (r.season && r.episode_number ? `Podcast · S${r.season}E${r.episode_number}` : 'Podcast'),
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Listen',
        cta_url: p.override_cta_url ?? `/podcast`,
        source_type: 'podcast', source_id: r.id,
      };
    },
    grant: async () => {
      const { data: g } = await supabase.from('grant_opportunities').select('id, slug, title, issuer, description, closes_at').eq('id', p.ref_id).maybeSingle();
      if (!g) return null;
      const r = g as { id: number; slug: string | null; title: string; issuer: string | null; description: string | null; closes_at: string | null };
      return {
        eyebrow: p.override_eyebrow ?? (r.issuer ? `Grant · ${r.issuer}` : 'Grant'),
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? (r.closes_at ? `Closes ${new Date(r.closes_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}` : null),
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Apply',
        cta_url: p.override_cta_url ?? `/grants`,
        source_type: 'grant', source_id: r.id,
      };
    },
    reading_challenge: async () => {
      const { data: rc } = await supabase.from('reading_challenges').select('id, slug, title, description, theme, year').eq('id', p.ref_id).maybeSingle();
      if (!rc) return null;
      const r = rc as { id: number; slug: string; title: string; description: string | null; theme: string | null; year: number | null };
      return {
        eyebrow: p.override_eyebrow ?? `Reading challenge${r.year ? ` · ${r.year}` : ''}`,
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.theme,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Join the challenge',
        cta_url: p.override_cta_url ?? '/reading-challenge',
        source_type: 'reading_challenge', source_id: r.id,
      };
    },
    banned_book: async () => {
      const { data: bb } = await supabase.from('banned_books').select('id, book_title, author, challenge_type, council_response').eq('id', p.ref_id).maybeSingle();
      if (!bb) return null;
      const r = bb as { id: number; book_title: string; author: string | null; challenge_type: string; council_response: string | null };
      return {
        eyebrow: p.override_eyebrow ?? `Freedom to read · ${r.challenge_type}`,
        title: p.override_title ?? r.book_title,
        subtitle: p.override_subtitle ?? r.author,
        body: p.override_body ?? r.council_response,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Read our response',
        cta_url: p.override_cta_url ?? '/banned-books',
        source_type: 'banned_book', source_id: r.id,
      };
    },
    programme: async () => {
      const { data: pg } = await supabase.from('programmes').select('id, slug, name, description').eq('id', p.ref_id).maybeSingle();
      if (!pg) return null;
      const r = pg as { id: number; slug: string | null; name: string; description: string | null };
      return {
        eyebrow: p.override_eyebrow ?? 'Programme',
        title: p.override_title ?? r.name,
        subtitle: p.override_subtitle,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'About the programme',
        cta_url: p.override_cta_url ?? '/programmes',
        source_type: 'programme', source_id: r.id,
      };
    },
    page: async () => {
      const { data: pg } = await supabase.from('pages').select('id, slug, title, meta_description').eq('id', p.ref_id).maybeSingle();
      if (!pg) return null;
      const r = pg as { id: number; slug: string; title: string; meta_description: string | null };
      return {
        eyebrow: p.override_eyebrow,
        title: p.override_title ?? r.title,
        subtitle: p.override_subtitle ?? r.meta_description,
        body: p.override_body,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Read',
        cta_url: p.override_cta_url ?? `/${r.slug}`,
        source_type: 'page', source_id: r.id,
      };
    },
    organisation: async () => {
      const { data: o } = await supabase.from('organisations').select('id, slug, name, description, logo_url').eq('id', p.ref_id).maybeSingle();
      if (!o) return null;
      const r = o as { id: number; slug: string | null; name: string; description: string | null; logo_url: string | null };
      return {
        eyebrow: p.override_eyebrow ?? 'Organisation',
        title: p.override_title ?? r.name,
        subtitle: p.override_subtitle,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url ?? r.logo_url,
        cta_text: p.override_cta_text ?? 'View',
        cta_url: p.override_cta_url ?? `/organisations`,
        source_type: 'organisation', source_id: r.id,
      };
    },
    working_group: async () => {
      const { data: wg } = await supabase.from('working_groups').select('id, slug, name, description, discipline').eq('id', p.ref_id).maybeSingle();
      if (!wg) return null;
      const r = wg as { id: number; slug: string; name: string; description: string | null; discipline: string };
      return {
        eyebrow: p.override_eyebrow ?? `Working group · ${r.discipline}`,
        title: p.override_title ?? r.name,
        subtitle: p.override_subtitle,
        body: p.override_body ?? r.description,
        image_url: p.override_image_url,
        cta_text: p.override_cta_text ?? 'Join the group',
        cta_url: p.override_cta_url ?? `/portal/working-groups/${r.slug}`,
        source_type: 'working_group', source_id: r.id,
      };
    },
  };

  const resolver = resolvers[p.content_kind as Exclude<ContentKind, 'custom'>];
  if (!resolver) return null;
  return resolver();
}

/**
 * Human-readable label for a placement kind — used in admin UI dropdowns
 */
export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  event: 'Event',
  book: 'Book',
  job: 'Job',
  award: 'Award',
  consultation: 'Consultation',
  post: 'News / blog post',
  press_release: 'Press release',
  podcast: 'Podcast episode',
  grant: 'Grant opportunity',
  reading_challenge: 'Reading challenge',
  banned_book: 'Banned-book entry',
  programme: 'Programme',
  page: 'Website page',
  organisation: 'Organisation',
  working_group: 'Working group',
  custom: 'Custom HTML',
};

export const STYLE_LABELS: Record<PlacementStyle, string> = {
  full_takeover: 'Full-bleed hero takeover',
  hero: 'Hero section',
  card: 'Card',
  banner: 'Thin banner',
  ticker: 'Scrolling ticker',
  callout: 'Callout box',
  modal: 'Pop-up modal',
  cta_strip: 'CTA strip',
};
