'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * DoorwayCard · section card that pulls to a silo page.
 *
 * Adapted from VACSA's DoorwayCard with CDCC palette.
 */

interface DoorwayCardProps {
  /** Eyebrow / section label rendered uppercase. */
  title: string;
  /** Headline / promise of the section. */
  description: string;
  /** Hover-revealed deeper context. */
  context: string;
  href: string;
  linkText?: string;
  dark?: boolean;
}

export function DoorwayCard({
  title,
  description,
  context,
  href,
  linkText = 'Explore',
  dark = false,
}: DoorwayCardProps) {
  const [expanded, setExpanded] = useState(false);

  const bg = dark ? 'bg-white/5' : 'bg-[var(--bg-2,#fafaf6)]';
  const border = dark
    ? 'border-white/10'
    : 'border-[var(--border-soft,rgba(43,43,43,0.08))]';
  const textPrimary = dark ? 'text-white' : 'text-[var(--fg-1,#2B2B2B)]';
  const textSub = dark ? 'text-white/60' : 'text-[var(--fg-2,#404045)]/80';
  const eyebrowColor = dark ? '#C5A15A' : 'var(--fg-3,#5A595E)';

  return (
    <div
      className={`${bg} border ${border} p-6 transition-shadow hover:shadow-md cursor-default rounded-sm`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded(!expanded)}
    >
      <p
        className="text-[10px] tracking-[0.2em] uppercase font-bold"
        style={{ color: eyebrowColor }}
      >
        {title}
      </p>
      <p className={`text-sm ${textPrimary} mt-2 leading-relaxed`}>
        {description}
      </p>

      {/* Hover context */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`pt-3 border-t ${border}`}>
          <p className={`text-xs ${textSub} leading-relaxed`}>{context}</p>
        </div>
      </div>

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
