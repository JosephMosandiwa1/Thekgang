'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import { CONTENT_KIND_LABELS, STYLE_LABELS, type ContentKind, type PlacementStyle } from '@/lib/placements';

interface Slot { id: number; slug: string; name: string; description: string | null; page_scope: string; max_concurrent: number }
interface Placement {
  id: number; slot_id: number; content_kind: ContentKind; ref_id: number | null;
  override_title: string | null; style: PlacementStyle; theme: string;
  priority: number; starts_at: string | null; ends_at: string | null;
  status: string; views_count: number; clicks_count: number; dismiss_count: number;
  created_at: string;
}

const STATUSES = ['draft', 'scheduled', 'live', 'paused', 'expired'] as const;

export default function AdminPlacements() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'live' | 'scheduled' | 'draft' | 'expired' | 'all'>('live');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [s, p] = await Promise.all([
      supabase.from('placement_slots').select('*').order('order_index'),
      supabase.from('placements').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    setSlots((s.data || []) as Slot[]);
    setPlacements((p.data || []) as Placement[]);
    setLoading(false);
  }

  async function setStatus(pid: number, status: string) {
    if (!supabase) return;
    await supabase.from('placements').update({ status }).eq('id', pid);
    load();
  }

  async function del(pid: number) {
    if (!supabase || !window.confirm('Delete this placement?')) return;
    await supabase.from('placements').delete().eq('id', pid);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  const now = new Date();
  function phase(p: Placement): 'live' | 'scheduled' | 'draft' | 'expired' | 'paused' {
    if (p.status === 'paused') return 'paused';
    if (p.status === 'draft') return 'draft';
    if (p.ends_at && new Date(p.ends_at) < now) return 'expired';
    if (p.starts_at && new Date(p.starts_at) > now) return 'scheduled';
    if (p.status === 'live') return 'live';
    return p.status as 'scheduled' | 'draft' | 'expired';
  }

  const filtered = placements.filter((p) => {
    if (tab === 'all') return true;
    return phase(p) === tab || (tab === 'draft' && p.status === 'draft');
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Placements</h1>
          <p className="text-sm text-gray-500 mt-1">WordPress-style widgets · place any content into any zone on the public site</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {(['live', 'scheduled', 'draft', 'expired', 'all'] as const).map((t) => {
          const count = t === 'all' ? placements.length : placements.filter((p) => phase(p) === t || (t === 'draft' && p.status === 'draft')).length;
          return (
            <button key={t} onClick={() => setTab(t)} className={`text-left border p-3 transition-colors ${tab === t ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{t}</p>
              <p className="text-xl font-bold mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold mb-4">Slot catalogue</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {slots.map((s) => {
            const liveCount = placements.filter((p) => p.slot_id === s.id && phase(p) === 'live').length;
            return (
              <div key={s.id} className="border border-gray-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{s.page_scope}</p>
                <p className="font-medium">{s.name}</p>
                {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>{liveCount} / {s.max_concurrent} live</span>
                  <span className="font-mono text-gray-400">{s.slug}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-4">Placements · {tab}</h2>
        {filtered.length === 0 ? <p className="text-sm text-gray-500">Nothing here.</p> : (
          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Slot</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Content</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Style</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">When</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Views / clicks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const slot = slots.find((s) => s.id === p.slot_id);
                  return (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-xs">{slot?.name || '—'}<div className="text-[10px] text-gray-400 font-mono">{slot?.slug}</div></td>
                      <td className="px-4 py-3"><div className="font-medium truncate max-w-[260px]">{p.override_title || `${CONTENT_KIND_LABELS[p.content_kind]} #${p.ref_id}`}</div><div className="text-[10px] text-gray-500">{CONTENT_KIND_LABELS[p.content_kind]}</div></td>
                      <td className="px-4 py-3 text-xs">{STYLE_LABELS[p.style]}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{p.priority}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {p.starts_at && <div>from {formatDateTime(p.starts_at)}</div>}
                        {p.ends_at && <div>until {formatDateTime(p.ends_at)}</div>}
                        {!p.starts_at && !p.ends_at && <div className="text-gray-400">always</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{p.views_count || 0} / {p.clicks_count || 0}</td>
                      <td className="px-4 py-3">
                        <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right"><button onClick={() => del(p.id)} className="text-xs text-red-700 hover:underline">Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
