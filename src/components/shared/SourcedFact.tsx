'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SourceRef } from '@/lib/sources/types';
import { citationHref, formatSourceCitation } from '@/lib/sources/types';

/**
 * SourcedFact · the sanctioned way to render a single stat or claim.
 *
 * Both `source` and `href` are REQUIRED at the type level — TypeScript
 * fails the build if either is missing, enforcing the discipline that
 * no fact appears without provenance + a doorway to its full context.
 *
 * Pattern: Value (gold, prominent) → Label → Source citation chip
 * (always visible) → optional why-here line → progressive-disclosure
 * context on hover/tap → mandatory doorway link.
 */

interface SourcedFactProps {
  /** The headline value (number, date, short claim). Rendered prominently. */
  value: string;
  /** Sub-label describing what `value` represents. */
  label: string;
  /** Citation. The component renders publisher · year, hyperlinked. */
  source: SourceRef;
  /** Doorway · where this fact's full context lives. */
  href: string;
  /** Optional explanation of why this fact matters in this section. */
  whyHere?: string;
  /** Optional deeper context revealed on hover/tap. */
  context?: string;
  /** Customise the doorway label. Default: "Learn more". */
  linkText?: string;
  dark?: boolean;
}

export function SourcedFact({
  value,
  label,
  source,
  href,
  whyHere,
  context,
  linkText = 'Learn more',
  dark = false,
}: SourcedFactProps) {
  const [expanded, setExpanded] = useState(false);

  const bg = dark ? 'bg-white/5' : 'bg-[var(--bg-2,#fafaf6)]';
  const border = dark ? 'border-white/10' : 'border-[var(--border-soft,rgba(43,43,43,0.08))]';
  const textPrimary = dark ? 'text-white' : 'text-[var(--fg-1,#2B2B2B)]';
  const textMuted = dark ? 'text-white/40' : 'text-[var(--fg-3,#5A595E)]/60';
  const textSub = dark ? 'text-white/60' : 'text-[var(--fg-2,#404045)]/80';

  const canExpand = Boolean(context);

  return (
    <div
      className={`${bg} border ${border} p-6 rounded-sm transition-shadow hover:shadow-md ${canExpand ? 'cursor-default' : ''}`}
      onMouseEnter={canExpand ? () => setExpanded(true) : undefined}
      onMouseLeave={canExpand ? () => setExpanded(false) : undefined}
      onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
    >
      <p
        className="text-2xl md:text-3xl font-bold tracking-tight"
        style={{ color: 'var(--cdcc-gold, #C5A15A)' }}
      >
        {value}
      </p>

      <p className={`text-sm font-medium ${textPrimary} mt-1`}>{label}</p>

      {/* Source citation · always visible */}
      <p className={`text-[10px] ${textMuted} mt-2 tracking-wide`}>
        Source ·{' '}
        <a
          href={citationHref(source)}
          target={source.url ? '_blank' : undefined}
          rel={source.url ? 'noopener noreferrer' : undefined}
          className="underline decoration-dotted underline-offset-2"
          onClick={(e) => e.stopPropagation()}
        >
          {formatSourceCitation(source)}
          {source.url ? ' ↗' : ''}
        </a>
      </p>

      {whyHere && (
        <p className={`text-xs ${textSub} mt-3 leading-relaxed`}>{whyHere}</p>
      )}

      {context && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`pt-3 border-t ${border}`}>
            <p className={`text-xs ${textSub} leading-relaxed`}>{context}</p>
          </div>
        </div>
      )}

      {/* Mandatory doorway */}
      <Link
        href={href}
        className="inline-block text-[11px] font-medium mt-3 transition-colors"
        style={{ color: 'var(--cdcc-gold, #C5A15A)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {linkText} &rarr;
      </Link>
    </div>
  );
}
