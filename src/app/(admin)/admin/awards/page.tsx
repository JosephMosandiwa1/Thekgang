'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, slugify, supabaseErrorMessage } from '@/lib/utils';

interface Award { id?: number; slug: string; name: string; description: string | null; category: string | null; prize_amount_rands: number | null; frequency: string; active: boolean }
interface Cycle { id?: number; award_id: number; year: number; nominations_open: string | null; nominations_close: string | null; winner_announced: string | null; status: string }
interface Nom { id: number; cycle_id: number; nominee_name: string; nominated_title: string | null; status: string; score: number | null; created_at: string }

export default function AdminAwards() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [noms, setNoms] = useState<Nom[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'awards' | 'cycles' | 'nominations'>('awards');
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [a, c, n] = await Promise.all([
      supabase.from('awards').select('*').order('name'),
      supabase.from('award_cycles').select('*').order('year', { ascending: false }),
      supabase.from('award_nominations').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setAwards((a.data || []) as Award[]);
    setCycles((c.data || []) as Cycle[]);
    setNoms((n.data || []) as Nom[]);
    setLoading(false);
  }

  async function saveAward() {
    if (!supabase || !editingAward) return;
    const record = { ...editingAward, slug: editingAward.slug || slugify(editingAward.name) };
    const { error } = editingAward.id ? await supabase.from('awards').update(record).eq('id', editingAward.id) : await supabase.from('awards').insert(record);
    if (error) alert(supabaseErrorMessage(error)); else { setEditingAward(null); load(); }
  }

  async function saveCycle() {
    if (!supabase || !editingCycle) return;
    const { error } = editingCycle.id ? await supabase.from('award_cycles').update(editingCycle).eq('id', editingCycle.id) : await supabase.from('award_cycles').insert(editingCycle);
    if (error) alert(supabaseErrorMessage(error)); else { setEditingCycle(null); load(); }
  }

  async function updateNom(n: Nom, patch: Partial<Nom>) {
    if (!supabase) return;
    await supabase.from('award_nominations').update(patch).eq('id', n.id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Literary awards</h1>
      <p className="text-sm text-gray-500 mb-8">Awards · cycles · nominations · judging</p>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        {(['awards', 'cycles', 'nominations'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm border-b-2 ${tab === t ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>{t} ({t === 'awards' ? awards.length : t === 'cycles' ? cycles.length : noms.length})</button>
        ))}
      </div>

      {tab === 'awards' && (
        <>
          <div className="mb-4"><button onClick={() => setEditingAward({ slug: '', name: '', description: null, category: null, prize_amount_rands: null, frequency: 'annual', active: true })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">+ New award</button></div>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Category</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Prize</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Frequency</th><th className="text-right px-4 py-3"></th></tr></thead>
              <tbody>
                {awards.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{a.category || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{a.prize_amount_rands ? formatRand(a.prize_amount_rands) : '—'}</td>
                    <td className="px-4 py-3 text-xs">{a.frequency}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setEditingAward(a)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'cycles' && (
        <>
          <div className="mb-4"><button onClick={() => setEditingCycle({ award_id: awards[0]?.id || 0, year: new Date().getFullYear() + 1, nominations_open: null, nominations_close: null, winner_announced: null, status: 'upcoming' })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">+ New cycle</button></div>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Award</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Year</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Nominations close</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-right px-4 py-3"></th></tr></thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{awards.find((a) => a.id === c.award_id)?.name || '—'}</td>
                    <td className="px-4 py-3">{c.year}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.nominations_close ? formatDate(c.nominations_close, 'short') : '—'}</td>
                    <td className="px-4 py-3"><span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5">{c.status}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setEditingCycle(c)} className="text-xs text-gray-500">Edit →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'nominations' && (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Nominee</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Cycle</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Score</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th></tr></thead>
            <tbody>
              {noms.map((n) => {
                const cycle = cycles.find((c) => c.id === n.cycle_id);
                const award = awards.find((a) => a.id === cycle?.award_id);
                return (
                  <tr key={n.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium">{n.nominee_name}</td>
                    <td className="px-4 py-3 text-xs">{n.nominated_title || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{award?.name} {cycle?.year}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{n.score ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select value={n.status} onChange={(e) => updateNom(n, { status: e.target.value })} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                        {['submitted', 'long_listed', 'shortlisted', 'winner', 'runner_up', 'withdrawn', 'ineligible'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingAward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingAward(null)}>
          <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editingAward.id ? 'Edit' : 'New'} award</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Name *</span><input value={editingAward.name} onChange={(e) => setEditingAward({ ...editingAward, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Category</span><input value={editingAward.category || ''} onChange={(e) => setEditingAward({ ...editingAward, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={3} value={editingAward.description || ''} onChange={(e) => setEditingAward({ ...editingAward, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Prize (ZAR)</span><input type="number" value={editingAward.prize_amount_rands ?? ''} onChange={(e) => setEditingAward({ ...editingAward, prize_amount_rands: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Frequency</span>
                  <select value={editingAward.frequency} onChange={(e) => setEditingAward({ ...editingAward, frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="annual">Annual</option><option value="biennial">Biennial</option><option value="triennial">Triennial</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editingAward.active} onChange={(e) => setEditingAward({ ...editingAward, active: e.target.checked })} />Active</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={saveAward} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditingAward(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}

      {editingCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingCycle(null)}>
          <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editingCycle.id ? 'Edit' : 'New'} cycle</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Award</span>
                <select value={editingCycle.award_id} onChange={(e) => setEditingCycle({ ...editingCycle, award_id: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                  {awards.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Year *</span><input type="number" value={editingCycle.year} onChange={(e) => setEditingCycle({ ...editingCycle, year: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editingCycle.status} onChange={(e) => setEditingCycle({ ...editingCycle, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {['upcoming', 'nominations', 'judging', 'shortlisted', 'announced', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Noms open</span><input type="date" value={editingCycle.nominations_open || ''} onChange={(e) => setEditingCycle({ ...editingCycle, nominations_open: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Noms close</span><input type="date" value={editingCycle.nominations_close || ''} onChange={(e) => setEditingCycle({ ...editingCycle, nominations_close: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Winner announced</span><input type="date" value={editingCycle.winner_announced || ''} onChange={(e) => setEditingCycle({ ...editingCycle, winner_announced: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={saveCycle} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditingCycle(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
