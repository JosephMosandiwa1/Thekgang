/**
 * Source-attribution + context-linking system · canonical types.
 *
 * `SourceRef` mirrors a row in the `sources` Supabase table — every
 * fact + every image on the public site references one. `MediaRef`
 * mirrors a row in the extended `media_library` table and always
 * carries its source.
 *
 * Required-by-construction: components that accept these types make
 * them required props, so a build fails if a fact or image renders
 * without provenance.
 *
 * See `docs/SOURCE_ATTRIBUTION.md` for the discipline.
 */

export type SourceKind =
  | 'survey'
  | 'masterplan'
  | 'gazette'
  | 'internal'
  | 'press'
  | 'research'
  | 'member_submission';

export type SourceStatus = 'draft' | 'pending_verification' | 'published';

export type License =
  | 'cc-by'
  | 'all-rights-reserved'
  | 'member-submitted'
  | 'public-domain'
  | 'press-release'
  | 'fair-use';

export interface SourceRef {
  id: string;
  slug: string;
  label: string;
  publisher: string;
  url: string | null;
  kind: SourceKind;
  publishedAt: string | null;     // ISO date or null
  retrievedAt?: string | null;
  notes?: string | null;
  status: SourceStatus;
}

export interface MediaRef {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  source: SourceRef;
  license: License;
  caption: string | null;
}

export interface ContentFact {
  id: string;
  surface: string;
  position: number;
  value: string;
  label: string;
  whyHere: string | null;
  context: string | null;
  source: SourceRef;
  href: string;
  status: SourceStatus;
  isActive: boolean;
}

/** Display-friendly publisher · year, e.g. "PASA · 2024" or "CDCC". */
export function formatSourceCitation(source: SourceRef): string {
  if (source.kind === 'internal') return source.publisher;
  const year = source.publishedAt ? source.publishedAt.slice(0, 4) : null;
  return year ? `${source.publisher} · ${year}` : source.publisher;
}

/** URL to point a citation chip at — external URL if available, else /evidence anchor. */
export function citationHref(source: SourceRef): string {
  return source.url ?? `/evidence#${source.slug}`;
}

export const LICENSE_LABEL: Record<License, string> = {
  'cc-by': 'CC BY',
  'all-rights-reserved': 'All rights reserved',
  'member-submitted': 'Member-submitted',
  'public-domain': 'Public domain',
  'press-release': 'Press release',
  'fair-use': 'Fair use',
};

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  survey: 'Survey',
  masterplan: 'Masterplan / Policy',
  gazette: 'Government gazette',
  internal: 'Internal · CDCC',
  press: 'Press release',
  research: 'Research',
  member_submission: 'Member submission',
};
