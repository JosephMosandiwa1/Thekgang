import { Placements } from './Placements';

/**
 * PageZone — server-rendered canonical anchor on a public page.
 *
 * Marketing pages render `<PageZone page="/about" position="sidebar" />`
 * at well-known anchor points. When admins create new placement_slots
 * targeting that (page, position) pair via /admin/placements/slots, the
 * zone lights up — no code edit needed.
 *
 * Convention · every public page renders four zones in order:
 *   - head             (top of page, above content)
 *   - before_content   (between hero and first content block)
 *   - sidebar          (right rail · displays inline on mobile)
 *   - footer           (bottom of page, before global footer)
 *
 * Empty zones render nothing (zero cost).
 *
 * NB · `'use client'` pages must use `<PageZoneClient>` instead because
 * server components can't render inside a client tree.
 */
interface PageZoneProps {
  page: string;
  position: 'head' | 'before_content' | 'sidebar' | 'between_sections' | 'footer';
  wrapperClassName?: string;
  limit?: number;
}

export function PageZone({ page, position, wrapperClassName, limit }: PageZoneProps) {
  return (
    <Placements
      page={page}
      position={position}
      wrapperClassName={wrapperClassName}
      limit={limit}
    />
  );
}
