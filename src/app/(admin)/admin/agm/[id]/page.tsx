'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, supabaseErrorMessage } from '@/lib/utils';

interface Agm { id: number; year: number; meeting_date: string | null; venue: string | null; status: string; quorum_required: number }
interface Res { id?: number; agm_id: number; resolution_number: string | null; title: string; motion: string; background: string | null; proposer: string | null; seconder: string | null; passed: boolean | null; votes_for: number; votes_against: number; votes_abstain: number; order_index: number }

export default function AdminAgmDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agmId = Number(id);
  const [agm, setAgm] = useState<Agm | null>(null);
  const [resolutions, setResolutions] = useState<Res[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Res | null>(null);

  useEffect(() => { load(); }, [agmId]);

  async function load() {
    if (!supabase) return;
    const [a, r] = await Promise.all([
      supabase.from('agm_events').select('*').eq('id', agmId).maybeSingle(),
      supabase.from('agm_resolutions').select('*').eq('agm_id', agmId).order('order_index'),
    ]);
    setAgm((a.data as Agm) || null);
    setResolutions((r.data || []) as Res[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const { error } = editing.id
      ? await supabase.from('agm_resolutions').update(editing).eq('id', editing.id)
      : await supabase.from('agm_resolutions').insert(editing);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  async function tally(r: Res) {
    if (!supabase) return;
    const { data: ballots } = await supabase.from('agm_ballots').select('choice').eq('resolution_id', r.id);
    const rows = (ballots || []) as { choice: string }[];
    const votes_for = rows.filter((b) => b.choice === 'for').length;
    const votes_against = rows.filter((b) => b.choice === 'against').length;
    const votes_abstain = rows.filter((b) => b.choice === 'abstain').length;
    const passed = votes_for > votes_against;
    await supabase.from('agm_resolutions').update({ votes_for, votes_against, votes_abstain, passed }).eq('id', r.id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!agm) return <p>Not found. <Link href="/admin/agm" className="underline">Back</Link></p>;

  return (
    <div>
      <Link href="/admin/agm" className="text-xs text-gray-500 hover:text-black">← All AGMs</Link>
      <div className="mt-4 mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">AGM · {agm.status}</p>
        <h1 className="font-display text-2xl font-bold">AGM {agm.year}</h1>
        {agm.meeting_date && <p className="text-sm text-gray-500 mt-1">{formatDateTime(agm.meeting_date)} · {agm.venue || 'Venue TBC'}</p>}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold">Resolutions</h2>
        <button onClick={() => setEditing({ agm_id: agmId, resolution_number: null, title: '', motion: '', background: null, proposer: null, seconder: null, passed: null, votes_for: 0, votes_against: 0, votes_abstain: 0, order_index: (resolutions.length + 1) * 10 })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">+ Add resolution</button>
      </div>

      <div className="space-y-3">
        {resolutions.map((r) => (
          <div key={r.id} className="border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{r.resolution_number || `Res #${r.order_index / 10}`}</p>
                <p className="font-display text-lg font-bold">{r.title}</p>
                <p className="text-sm text-gray-700 mt-2">{r.motion}</p>
                {r.background && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{r.background}</p>}
                {(r.proposer || r.seconder) && <p className="text-[10px] text-gray-500 mt-2">Proposer: {r.proposer || '—'} · Seconder: {r.seconder || '—'}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono space-y-1">
                  <p>For: <strong>{r.votes_for}</strong></p>
                  <p>Against: <strong>{r.votes_against}</strong></p>
                  <p>Abstain: <strong>{r.votes_abstain}</strong></p>
                </div>
                {r.passed !== null && (
                  <p className={`mt-2 text-xs uppercase tracking-wider px-2 py-0.5 ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.passed ? 'Passed' : 'Failed'}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4 text-xs">
              <button onClick={() => tally(r)} className="uppercase tracking-wider border border-gray-300 px-3 py-1 hover:border-black">Tally votes</button>
              <button onClick={() => setEditing(r)} className="text-gray-500 hover:text-black">Edit →</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} resolution</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Resolution number</span><input value={editing.resolution_number || ''} onChange={(e) => setEditing({ ...editing, resolution_number: e.target.value })} placeholder="Res 1 of 2026" className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Order</span><input type="number" value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Motion *</span><textarea rows={3} value={editing.motion} onChange={(e) => setEditing({ ...editing, motion: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Background</span><textarea rows={4} value={editing.background || ''} onChange={(e) => setEditing({ ...editing, background: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Proposer</span><input value={editing.proposer || ''} onChange={(e) => setEditing({ ...editing, proposer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Seconder</span><input value={editing.seconder || ''} onChange={(e) => setEditing({ ...editing, seconder: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
