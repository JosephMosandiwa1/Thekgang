import Link from 'next/link';
import type { SourceRef } from '@/lib/sources/types';
import { citationHref, formatSourceCitation } from '@/lib/sources/types';

/**
 * SourceStrip · page-level macro citation.
 *
 * Renders a thin horizontal strip listing every source cited on the
 * page, plus a link to the full /evidence registry. Appears at the top
 * or bottom of any data-driven public page.
 *
 * Adapted from VACSA's SourceStrip with CDCC charcoal/gold tokens.
 */

interface SourceStripProps {
  sources: SourceRef[];
  /** Override the methodology link · defaults to /evidence. */
  methodologyHref?: string;
  /** Compact variant for footer placement. */
  compact?: boolean;
  dark?: boolean;
}

export function SourceStrip({
  sources,
  methodologyHref = '/evidence',
  compact = false,
  dark = false,
}: SourceStripProps) {
  if (sources.length === 0) return null;

  const bg = dark ? 'bg-white/5' : 'bg-[var(--bg-2,#fafaf6)]';
  const border = dark ? 'border-white/10' : 'border-[var(--border-soft,rgba(43,43,43,0.08))]';
  const textMuted = dark ? 'text-white/55' : 'text-[var(--fg-3,#5A595E)]';
  const textLink = dark ? 'text-white/85 hover:text-white' : 'text-[var(--fg-1,#2B2B2B)] hover:text-black';

  return (
    <aside
      className={`${bg} border ${border} rounded-sm ${compact ? 'px-4 py-2' : 'px-5 py-3'}`}
      aria-label="Sources cited on this page"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-snug">
        <span className={`uppercase tracking-[0.18em] font-semibold ${textMuted}`} style={{ fontSize: 10 }}>
          Sources
        </span>
        {sources.map((s, i) => (
          <span key={s.id} className="flex items-center gap-3">
            <a
              href={citationHref(s)}
              target={s.url ? '_blank' : undefined}
              rel={s.url ? 'noopener noreferrer' : undefined}
              className={`${textLink} underline decoration-dotted underline-offset-4`}
            >
              {formatSourceCitation(s)}
              {s.url ? ' ↗' : ''}
            </a>
            {i < sources.length - 1 && <span className={textMuted}>·</span>}
          </span>
        ))}
        <span className={textMuted}>·</span>
        <Link
          href={methodologyHref}
          className={`${textLink} underline decoration-dotted underline-offset-4`}
        >
          Full evidence base &rarr;
        </Link>
      </div>
    </aside>
  );
}
