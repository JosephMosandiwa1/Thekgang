import Link from 'next/link';
import { loadAllPublishedSources } from '@/lib/sources/load';
import { SOURCE_KIND_LABEL, type SourceKind, type SourceRef, formatSourceCitation } from '@/lib/sources/types';

/**
 * /evidence · the citations registry.
 *
 * Server component. Reads every published `sources` row, groups by
 * kind, and renders one card per source. The promise this page makes
 * is plain: every claim and every image on cdcc.org.za is traceable
 * to a published source — and this page is the registry.
 *
 * If the registry is empty (only `cdcc-self` seeded), the page shows
 * the empty-state copy and the single internal entry. As admins add
 * verified external sources via /admin/sources, they appear here.
 */

export const revalidate = 60;

const KIND_ORDER: SourceKind[] = [
  'internal',
  'survey',
  'masterplan',
  'gazette',
  'research',
  'press',
  'member_submission',
];

export default async function EvidencePage() {
  const sources = await loadAllPublishedSources();
  const grouped = groupByKind(sources);

  return (
    <div className="pt-28 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Evidence base</p>
        <h1
          className="font-display font-bold text-black tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}
        >
          Where our facts come from.
        </h1>
        <p className="text-gray-600 max-w-2xl mb-12 text-sm leading-relaxed">
          Every claim and every image on cdcc.org.za traces back to a published source.
          This page is the registry. Each card lists who published it, when, and where to read it.
          Sources awaiting verification do not appear here.
        </p>

        {sources.length === 1 && (
          <div className="border border-amber-300/40 bg-amber-50 px-4 py-3 rounded text-xs text-amber-900 mb-10">
            The CDCC evidence base is being assembled. Verified external citations
            (industry surveys, government masterplans, peer-reviewed research) will
            be published here as they are confirmed.
          </div>
        )}

        {KIND_ORDER.map((kind) => {
          const list = grouped[kind] ?? [];
          if (list.length === 0) return null;
          return (
            <section key={kind} className="mb-12">
              <h2 className="font-display text-xl font-bold text-black mb-4">
                {SOURCE_KIND_LABEL[kind]}
                <span className="ml-3 text-[10px] uppercase tracking-[0.2em] text-gray-500/60 font-normal">
                  {list.length} {list.length === 1 ? 'source' : 'sources'}
                </span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {list.map((s) => (
                  <SourceCard key={s.id} source={s} />
                ))}
              </div>
            </section>
          );
        })}

        <hr className="my-12 border-gray-200" />

        <p className="text-xs text-gray-500 leading-relaxed">
          Spotted a fact on the site without a citation here? That's a bug — please{' '}
          <Link href="/contact" className="underline">tell the secretariat</Link>{' '}
          and we'll either add the source or correct the page.
        </p>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: SourceRef }) {
  return (
    <article
      id={source.slug}
      className="border border-gray-200 bg-white p-5 rounded-sm scroll-mt-24"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-2">
        {SOURCE_KIND_LABEL[source.kind]}
      </p>
      <h3 className="font-display text-base font-bold text-black mb-1 leading-snug">
        {source.label}
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        {formatSourceCitation(source)}
        {source.publishedAt && source.kind !== 'internal' && (
          <span className="text-gray-500/60"> · published {formatDate(source.publishedAt)}</span>
        )}
      </p>

      {source.notes && (
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{source.notes}</p>
      )}

      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] font-medium text-black hover:underline"
        >
          Read the source &rarr;
        </a>
      ) : (
        <p className="text-[10px] text-gray-500/60 italic">
          {source.kind === 'internal'
            ? 'Council-direct attribution. No external URL.'
            : 'External URL pending.'}
        </p>
      )}

      {source.retrievedAt && (
        <p className="text-[10px] text-gray-500/50 mt-3">
          Last verified: {formatDate(source.retrievedAt)}
        </p>
      )}
    </article>
  );
}

function groupByKind(sources: SourceRef[]): Partial<Record<SourceKind, SourceRef[]>> {
  const out: Partial<Record<SourceKind, SourceRef[]>> = {};
  for (const s of sources) {
    (out[s.kind] ??= []).push(s);
  }
  return out;
}

function formatDate(iso: string): string {
  // ISO yyyy-mm-dd -> "Mar 2026" or "2026" if year-only
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
}
