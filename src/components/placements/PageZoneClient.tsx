'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  fetchLivePlacementsForPagePosition,
  resolvePlacement,
  type DisplayPayload,
  type PlacementRow,
} from '@/lib/placements';

/**
 * PageZoneClient — same canonical anchor as `<PageZone>` but renders
 * inside a client component tree.
 *
 * `<PageZone>` is server-rendered (preferred — no JS, server data).
 * Use this client variant ONLY when the parent page is `'use client'`
 * (about/the-plan/ecosystem/stakeholders/advocacy until they move to
 * server components).
 *
 * Output: simple, brand-aligned cards with image / eyebrow / title /
 * subtitle / CTA. Doesn't replicate the 7 server-side style components
 * (those are server-only); good-enough for marketing-page sidebars
 * + footer strips.
 */

interface Props {
  page: string;
  position: 'head' | 'before_content' | 'sidebar' | 'between_sections' | 'footer';
  wrapperClassName?: string;
  limit?: number;
}

export function PageZoneClient({ page, position, wrapperClassName, limit = 3 }: Props) {
  const [items, setItems] = useState<Array<{ row: PlacementRow; payload: DisplayPayload }>>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sb = supabase;
    if (!sb) { setHydrated(true); return; }
    let cancelled = false;
    (async () => {
      const rows = await fetchLivePlacementsForPagePosition(sb, page, position, limit);
      if (cancelled) return;
      const resolved = await Promise.all(rows.map(async (r) => {
        const payload = await resolvePlacement(sb, r);
        return payload ? { row: r, payload } : null;
      }));
      if (cancelled) return;
      setItems(resolved.filter((x): x is { row: PlacementRow; payload: DisplayPayload } => x !== null));
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [page, position, limit]);

  if (!hydrated || items.length === 0) return null;

  const inner = items.map(({ row, payload }) => (
    <article
      key={row.id}
      className="border border-gray-200 rounded-sm overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      {payload.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={payload.image_url} alt="" className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        {payload.eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/70 mb-2">{payload.eyebrow}</p>
        )}
        <h3 className="font-display text-base font-bold text-black leading-tight">{payload.title}</h3>
        {payload.subtitle && <p className="text-xs text-gray-600 mt-1">{payload.subtitle}</p>}
        {payload.body && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{payload.body}</p>}
        <Link
          href={payload.cta_url}
          className="inline-block text-[11px] font-medium mt-3 transition-colors"
          style={{ color: 'var(--cdcc-gold, #C5A15A)' }}
        >
          {payload.cta_text} →
        </Link>
      </div>
    </article>
  ));

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{inner}</div>;
  }
  return <div className="grid gap-3">{inner}</div>;
}
