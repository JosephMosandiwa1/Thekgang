'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, supabaseErrorMessage } from '@/lib/utils';

interface Agm { id?: number; year: number; meeting_date: string | null; venue: string | null; virtual_link: string | null; quorum_required: number; status: string; minutes_url: string | null }

const STATUSES = ['upcoming', 'open', 'voting', 'closed', 'minutes_ready'];

export default function AdminAGMList() {
  const [rows, setRows] = useState<Agm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Agm | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('agm_events').select('*').order('year', { ascending: false });
    setRows((data || []) as Agm[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const { error } = editing.id ? await supabase.from('agm_events').update(editing).eq('id', editing.id) : await supabase.from('agm_events').insert(editing);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div><h1 className="text-2xl font-display font-bold">AGM</h1><p className="text-sm text-gray-500 mt-1">Annual General Meetings · resolutions · voting</p></div>
        <button onClick={() => setEditing({ year: new Date().getFullYear(), meeting_date: null, venue: null, virtual_link: null, quorum_required: 15, status: 'upcoming', minutes_url: null })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New AGM</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((a) => (
          <Link key={a.id} href={`/admin/agm/${a.id}`} className="border border-gray-200 p-5 hover:border-black transition-colors block">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{a.status}</p>
            <p className="font-display text-xl font-bold">AGM {a.year}</p>
            {a.meeting_date && <p className="text-xs text-gray-500 mt-1">{formatDateTime(a.meeting_date)}</p>}
            {a.venue && <p className="text-xs text-gray-500 mt-1">{a.venue}</p>}
          </Link>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} AGM</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Year *</span><input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Meeting date</span><input type="datetime-local" value={editing.meeting_date?.slice(0, 16) || ''} onChange={(e) => setEditing({ ...editing, meeting_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Venue</span><input value={editing.venue || ''} onChange={(e) => setEditing({ ...editing, venue: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Virtual link</span><input value={editing.virtual_link || ''} onChange={(e) => setEditing({ ...editing, virtual_link: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Quorum required (%)</span><input type="number" value={editing.quorum_required} onChange={(e) => setEditing({ ...editing, quorum_required: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Minutes URL</span><input value={editing.minutes_url || ''} onChange={(e) => setEditing({ ...editing, minutes_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
