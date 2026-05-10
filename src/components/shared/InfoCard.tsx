'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SourceRef } from '@/lib/sources/types';
import { citationHref, formatSourceCitation } from '@/lib/sources/types';

/**
 * InfoCard · enforces the IA pattern · Value → Source → Why here →
 *           Hover context → Doorway link
 *
 * `source` is now a typed `SourceRef` — the upstream change that lifts
 * the discipline from optional convention to compile-time guarantee.
 * `href` is required. Every InfoCard call carries provenance + a
 * doorway by construction.
 *
 * For new content, prefer `SourcedFact` which has identical semantics
 * + `whyHere`/`context` props named to match the doc.
 */

interface InfoCardProps {
  value: string;
  label: string;
  source: SourceRef;             // REQUIRED — was free-form string
  context: string;
  href: string;                  // REQUIRED
  linkText?: string;
  whyHere?: string;
  dark?: boolean;
}

export function InfoCard({
  value,
  label,
  source,
  context,
  href,
  linkText = 'Learn more',
  whyHere,
  dark = false,
}: InfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const bg = dark ? 'bg-white/5' : 'bg-[var(--bg-2,#fafaf6)]';
  const border = dark ? 'border-white/10' : 'border-[var(--border-soft,rgba(43,43,43,0.08))]';
  const textPrimary = dark ? 'text-white' : 'text-[var(--fg-1,#2B2B2B)]';
  const textMuted = dark ? 'text-white/40' : 'text-[var(--fg-3,#5A595E)]/60';
  const textSub = dark ? 'text-white/60' : 'text-[var(--fg-2,#404045)]/80';

  return (
    <div
      className={`${bg} border ${border} p-6 transition-shadow hover:shadow-md cursor-default group relative rounded-sm`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Value — gold */}
      <p className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--cdcc-gold, #C5A15A)' }}>
        {value}
      </p>

      {/* Label */}
      <p className={`text-sm font-medium ${textPrimary} mt-1`}>{label}</p>

      {/* Source citation — always visible */}
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

      {/* Why here — always visible if provided */}
      {whyHere && (
        <p className={`text-xs ${textSub} mt-3 leading-relaxed`}>{whyHere}</p>
      )}

      {/* Hover/tap context — progressive disclosure */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`pt-3 border-t ${border}`}>
          <p className={`text-xs ${textSub} leading-relaxed`}>{context}</p>
        </div>
      </div>

      {/* Doorway link — always visible */}
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
