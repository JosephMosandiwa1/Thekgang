'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * InfoCard · enforces the IA pattern · Value → Source → Why here →
 *           Hover context → Doorway link
 *
 * Adapted from VACSA's pattern. CDCC palette: gold accent on cream
 * (light) / on charcoal (dark).
 */

interface InfoCardProps {
  value: string;
  label: string;
  source: string;
  context: string;
  href: string;
  linkText?: string;
  /** Why this stat matters in the section it appears in. */
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

      {/* Source — always visible */}
      <p className={`text-[10px] ${textMuted} mt-2 tracking-wide`}>{source}</p>

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
      >
        {linkText} &rarr;
      </Link>
    </div>
  );
}
