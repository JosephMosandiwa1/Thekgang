'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { resolvePlacement, type PlacementRow, type DisplayPayload } from '@/lib/placements';
import { BannerStyle } from './styles/BannerStyle';
import { TickerRow } from './styles/TickerStyle';
import { ModalStyle } from './styles/ModalStyle';
import { CalloutStyle } from './styles/CardStyle';
import { CtaStripStyle } from './styles/CtaStripStyle';

type Item = { row: PlacementRow; payload: DisplayPayload };

async function fetchSlot(slotSlug: string): Promise<Item[]> {
  if (!supabase) return [];
  const { data: slot } = await supabase.from('placement_slots').select('id, max_concurrent').eq('slug', slotSlug).maybeSingle();
  if (!slot) return [];
  const s = slot as { id: number; max_concurrent: number };
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('placements')
    .select('*')
    .eq('slot_id', s.id)
    .eq('status', 'live')
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order('priority', { ascending: false })
    .limit(s.max_concurrent);
  const rows = ((data || []) as unknown) as PlacementRow[];
  const resolved = await Promise.all(rows.map(async (r) => ({ row: r, payload: await resolvePlacement(supabase!, r) })));
  return resolved.filter((x): x is Item => x.payload !== null);
}

export function GlobalBanner() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetchSlot('global_banner').then(setItems); }, []);
  const it = items[0];
  if (!it) return null;
  return <BannerStyle placement_id={it.row.id} payload={it.payload} theme={it.row.theme} background_color={it.row.background_color} text_color={it.row.text_color} accent_color={it.row.accent_color} text_align={it.row.text_align} />;
}

export function GlobalTicker() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => { fetchSlot('global_ticker').then(setItems); }, []);
  if (items.length === 0) return null;
  return <TickerRow items={items.map((it) => ({ placement_id: it.row.id, payload: it.payload }))} theme="dark" />;
}

export function GlobalTakeover() {
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => { fetchSlot('takeover').then((list) => setItem(list[0] || null)); }, []);
  if (!item) return null;
  return <ModalStyle placement_id={item.row.id} payload={item.payload} theme={item.row.theme} background_color={item.row.background_color} text_color={item.row.text_color} accent_color={item.row.accent_color} text_align={item.row.text_align} frequency={(item.row.frequency as 'once' | 'daily' | 'session' | 'always') || 'session'} />;
}

export function FooterCallout() {
  const [item, setItem] = useState<Item | null>(null);
  useEffect(() => { fetchSlot('footer_callout').then((list) => setItem(list[0] || null)); }, []);
  if (!item) return null;
  const props = {
    placement_id: item.row.id,
    payload: item.payload,
    theme: item.row.theme,
    background_color: item.row.background_color,
    text_color: item.row.text_color,
    accent_color: item.row.accent_color,
    text_align: item.row.text_align,
  };
  if (item.row.style === 'cta_strip') return <CtaStripStyle {...props} />;
  return <CalloutStyle {...props} />;
}
