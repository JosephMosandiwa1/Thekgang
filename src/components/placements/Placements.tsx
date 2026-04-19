import { getSupabase } from '@/lib/supabase/server';
import { fetchLivePlacements, resolvePlacement, type PlacementRow } from '@/lib/placements';
import { HeroStyle, FullTakeoverStyle } from './styles/HeroStyle';
import { CardStyle, CalloutStyle } from './styles/CardStyle';
import { BannerStyle } from './styles/BannerStyle';
import { TickerRow } from './styles/TickerStyle';
import { ModalStyle } from './styles/ModalStyle';
import { CtaStripStyle } from './styles/CtaStripStyle';

/**
 * Placements — server component that fetches + renders all live placements
 * for a given slot.
 *
 * Usage:
 *   <Placements slot="homepage_hero" />
 *   <Placements slot="homepage_featured" wrapperClassName="grid md:grid-cols-3 gap-4 px-6 max-w-6xl mx-auto" />
 */
interface PlacementsProps {
  slot: string;
  wrapperClassName?: string;
  limit?: number;
}

export async function Placements({ slot, wrapperClassName, limit }: PlacementsProps) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const rows = await fetchLivePlacements(supabase, slot, limit);
  if (rows.length === 0) return null;

  // For tickers, render as a single row combining all items
  if (rows.every((r) => r.style === 'ticker')) {
    const items = (await Promise.all(rows.map(async (r) => {
      const payload = await resolvePlacement(supabase, r);
      return payload ? { placement_id: r.id, payload } : null;
    }))).filter((x): x is NonNullable<typeof x> => x !== null);
    if (items.length === 0) return null;
    return <TickerRow items={items} theme="dark" />;
  }

  const resolved = await Promise.all(rows.map(async (r) => ({ row: r, payload: await resolvePlacement(supabase, r) })));
  const usable = resolved.filter((x): x is { row: PlacementRow; payload: NonNullable<typeof x.payload> } => x.payload !== null);
  if (usable.length === 0) return null;

  const elements = usable.map(({ row, payload }) => {
    const props = {
      placement_id: row.id,
      payload,
      theme: row.theme,
      background_color: row.background_color,
      text_color: row.text_color,
      accent_color: row.accent_color,
      text_align: row.text_align,
    };
    switch (row.style) {
      case 'full_takeover': return <FullTakeoverStyle key={row.id} {...props} />;
      case 'hero':          return <HeroStyle key={row.id} {...props} />;
      case 'card':          return <CardStyle key={row.id} {...props} />;
      case 'callout':       return <CalloutStyle key={row.id} {...props} />;
      case 'banner':        return <BannerStyle key={row.id} {...props} />;
      case 'cta_strip':     return <CtaStripStyle key={row.id} {...props} />;
      case 'modal':         return <ModalStyle key={row.id} {...props} frequency={(row.frequency as 'once'|'daily'|'session'|'always') || 'session'} />;
      default:              return null;
    }
  });

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{elements}</div>;
  }
  return <>{elements}</>;
}
