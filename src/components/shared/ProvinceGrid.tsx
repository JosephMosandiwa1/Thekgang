'use client';

import Link from 'next/link';
import { SA_PROVINCES } from '@/lib/utils';

/**
 * ProvinceGrid · provincial-rollup grid.
 *
 * Renders a 3-column grid of the 9 SA provinces with an arbitrary
 * data point per province (member count, programme count, etc.) +
 * an optional doorway link to the per-province page.
 *
 * Adapted from VACSA's pattern. Uses CDCC's canonical SA_PROVINCES
 * constant so we don't duplicate the registry.
 *
 * Usage:
 *   <ProvinceGrid
 *     data={{ Gauteng: 412, 'Western Cape': 180, ... }}
 *     unit="members"
 *     hrefBase="/sector?province="
 *   />
 */

interface ProvinceGridProps {
  /** Map of province name → numeric value to display. */
  data: Partial<Record<(typeof SA_PROVINCES)[number], number>>;
  /** Unit label rendered after the value (e.g. "members", "programmes"). */
  unit?: string;
  /** Optional link base · province name appended (URL-encoded). */
  hrefBase?: string;
  /** Optional column count override. Default 3. */
  columns?: 2 | 3 | 4;
  dark?: boolean;
}

export function ProvinceGrid({
  data,
  unit,
  hrefBase,
  columns = 3,
  dark = false,
}: ProvinceGridProps) {
  const colsClass =
    columns === 2 ? 'sm:grid-cols-2'
    : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4'
    : 'sm:grid-cols-2 md:grid-cols-3';

  const total = Object.values(data).reduce<number>((sum, n) => sum + (n ?? 0), 0);

  const bg = dark ? 'bg-white/5' : 'bg-[var(--bg-2,#fafaf6)]';
  const border = dark
    ? 'border-white/10'
    : 'border-[var(--border-soft,rgba(43,43,43,0.08))]';
  const textPrimary = dark ? 'text-white' : 'text-[var(--fg-1,#2B2B2B)]';
  const textSub = dark ? 'text-white/60' : 'text-[var(--fg-3,#5A595E)]';

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-3`}>
      {SA_PROVINCES.map((province) => {
        const value = data[province] ?? 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        const inner = (
          <div className={`${bg} border ${border} p-4 rounded-sm transition-shadow hover:shadow-sm h-full`}>
            <p className={`text-[10px] uppercase tracking-[0.15em] ${textSub} font-semibold mb-2`}>
              {province}
            </p>
            <p
              className={`text-xl font-bold tracking-tight ${textPrimary}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {value.toLocaleString('en-ZA')}
              {unit && (
                <span className={`text-[11px] font-normal ml-2 ${textSub}`}>
                  {unit}
                </span>
              )}
            </p>
            {total > 0 && (
              <div
                className="mt-3 h-[2px] rounded-full overflow-hidden"
                style={{ backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(43,43,43,0.08)' }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    backgroundColor: 'var(--cdcc-gold, #C5A15A)',
                    height: '100%',
                  }}
                />
              </div>
            )}
          </div>
        );

        if (hrefBase) {
          return (
            <Link
              key={province}
              href={`${hrefBase}${encodeURIComponent(province)}`}
              className="block"
            >
              {inner}
            </Link>
          );
        }
        return <div key={province}>{inner}</div>;
      })}
    </div>
  );
}
