'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { FeatureOnSiteButton } from '@/components/placements/FeatureOnSiteButton';
import { STYLE_LABELS, type PlacementStyle } from '@/lib/placements';

/**
 * SurfacesTab — operator mission control for one event.
 *
 * Lists every active placement_slot grouped by page. Per row:
 *   ⬤ Featured · live until {ends_at} · [Edit · Pause · Remove]
 *   ◯ Not featured · [+ Feature here]
 *
 * Plus a banner row for calendar visibility (implicit on status='published').
 */

interface Slot {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  page_path: string | null;
  position: string | null;
  default_style: string;
  supports_styles: string[];
  active: boolean;
  max_concurrent: number;
}

interface Placement {
  id: number;
  slot_id: number;
  style: PlacementStyle;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  override_title: string | null;
}

interface Props {
  eventId: number;
  eventTitle: string;
  eventStatus: string;
}

export function SurfacesTab({ eventId, eventTitle, eventStatus }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('placement_slots').select('*').eq('active', true).order('page_path', { ascending: true, nullsFirst: false }).order('order_index'),
      supabase.from('placements').select('id, slot_id, style, status, starts_at, ends_at, override_title').eq('content_kind', 'event').eq('ref_id', eventId),
    ]);
    setSlots((s ?? []) as Slot[]);
    setPlacements((p ?? []) as Placement[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(placementId: number, status: string) {
    if (!supabase) return;
    setBusy(placementId);
    await supabase.from('placements').update({ status }).eq('id', placementId);
    await load();
    setBusy(null);
  }

  async function remove(placementId: number) {
    if (!supabase || !confirm('Remove this placement?')) return;
    setBusy(placementId);
    await supabase.from('placements').delete().eq('id', placementId);
    await load();
    setBusy(null);
  }

  if (loading) return <div className="text-sm text-gray-500">Loading surfaces…</div>;

  // Group slots by page
  const grouped = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = s.page_path ?? '(global)';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }
  const pages = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  const slotPlacements = (slotId: number) => placements.filter((p) => p.slot_id === slotId);

  return (
    <div className="space-y-6">
      {/* Calendar visibility banner */}
      <section className={`p-4 border rounded ${eventStatus === 'draft' ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/40'}`}>
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/70 mb-1">Marketing-site calendar</p>
            <p className="text-sm">
              {eventStatus === 'draft'
                ? <><strong>Hidden from calendar.</strong> Publish this event (status ≠ draft) to appear in <Link href="/events/calendar" className="underline" target="_blank">/events/calendar</Link>.</>
                : <><strong>Showing in calendar.</strong> Visible at <Link href="/events/calendar" className="underline" target="_blank">/events/calendar</Link> on its event date.</>
              }
            </p>
          </div>
        </div>
      </section>

      <div>
        <h3 className="font-display text-base font-bold text-black">Where this event appears</h3>
        <p className="text-xs text-gray-600 mt-1">Slots are admin-defined positions on public pages. Add a new slot at <Link href="/admin/placements/slots" className="underline">/admin/placements/slots</Link>.</p>
      </div>

      {pages.map(([pageKey, pageSlots]) => (
        <section key={pageKey}>
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-gray-500/80 font-semibold border-b border-gray-200 pb-1 mb-3">
            {pageKey === '(global)' ? 'Global · multi-page' : pageKey}
          </h4>
          <ul className="divide-y divide-gray-100">
            {pageSlots.map((slot) => {
              const live = slotPlacements(slot.id);
              const featured = live.length > 0;
              return (
                <li key={slot.id} className="py-3 flex items-start gap-4">
                  <span className={`mt-1 text-lg leading-none ${featured ? 'text-emerald-600' : 'text-gray-300'}`} aria-hidden>
                    {featured ? '⬤' : '◯'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black">
                      {slot.name}
                      <span className="text-[10px] text-gray-500 font-mono ml-2">{slot.position ?? slot.slug}</span>
                    </p>
                    {slot.description && <p className="text-[11px] text-gray-500 mt-0.5">{slot.description}</p>}
                    {featured && (
                      <div className="mt-2 space-y-1">
                        {live.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                              p.status === 'live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'paused' ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                            >
                              {p.status}
                            </span>
                            <span className="text-gray-600">{STYLE_LABELS[p.style]}</span>
                            {p.ends_at && <span className="text-gray-500/70">until {new Date(p.ends_at).toLocaleDateString('en-ZA')}</span>}
                            <div className="ml-auto flex items-center gap-2">
                              {p.status !== 'paused' ? (
                                <button onClick={() => setStatus(p.id, 'paused')} disabled={busy === p.id} className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-black disabled:opacity-30">Pause</button>
                              ) : (
                                <button onClick={() => setStatus(p.id, 'live')} disabled={busy === p.id} className="text-[10px] uppercase tracking-wider text-emerald-700 hover:text-emerald-900 disabled:opacity-30">Resume</button>
                              )}
                              <button onClick={() => remove(p.id)} disabled={busy === p.id} className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 disabled:opacity-30">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <FeatureOnSiteButton
                      contentKind="event"
                      refId={eventId}
                      contentTitle={eventTitle}
                      label={featured ? '+ Add another' : '+ Feature here'}
                      className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-black border border-gray-200 hover:border-black px-3 py-1.5 rounded-sm"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
