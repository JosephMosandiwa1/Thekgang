'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, slugify, supabaseErrorMessage } from '@/lib/utils';

interface Release { id?: number; slug: string; title: string; dateline: string | null; summary: string | null; body: string | null; topic: string | null; released_at: string | null; status: string; spokesperson_id: number | null; press_kit_url: string | null }
interface Spokes { id?: number; name: string; role: string | null; email: string | null; phone: string | null; bio: string | null; topics: string[]; available: boolean; order_index: number; headshot_url: string | null }

export default function AdminPress() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [spokes, setSpokes] = useState<Spokes[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'releases' | 'spokes'>('releases');
  const [editingRel, setEditingRel] = useState<Release | null>(null);
  const [editingSp, setEditingSp] = useState<Spokes | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [r, s] = await Promise.all([
      supabase.from('press_releases').select('*').order('released_at', { ascending: false, nullsFirst: false }),
      supabase.from('press_spokespeople').select('*').order('order_index'),
    ]);
    setReleases((r.data || []) as Release[]);
    setSpokes((s.data || []) as Spokes[]);
    setLoading(false);
  }

  async function saveRelease() {
    if (!supabase || !editingRel) return;
    const record = { ...editingRel, slug: editingRel.slug || slugify(editingRel.title) };
    const { error } = editingRel.id
      ? await supabase.from('press_releases').update(record).eq('id', editingRel.id)
      : await supabase.from('press_releases').insert(record);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditingRel(null); load(); }
  }

  async function saveSpokes() {
    if (!supabase || !editingSp) return;
    const { error } = editingSp.id
      ? await supabase.from('press_spokespeople').update(editingSp).eq('id', editingSp.id)
      : await supabase.from('press_spokespeople').insert(editingSp);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditingSp(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Press room</h1>
          <p className="text-sm text-gray-500 mt-1">Releases, spokespeople, media kit</p>
        </div>
        {tab === 'releases' && <button onClick={() => setEditingRel({ slug: '', title: '', dateline: null, summary: null, body: null, topic: null, released_at: null, status: 'draft', spokesperson_id: null, press_kit_url: null })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Release</button>}
        {tab === 'spokes' && <button onClick={() => setEditingSp({ name: '', role: null, email: null, phone: null, bio: null, topics: [], available: true, order_index: 100, headshot_url: null })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Spokesperson</button>}
      </div>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        <button onClick={() => setTab('releases')} className={`pb-3 text-sm border-b-2 ${tab === 'releases' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>Releases ({releases.length})</button>
        <button onClick={() => setTab('spokes')} className={`pb-3 text-sm border-b-2 ${tab === 'spokes' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>Spokespeople ({spokes.length})</button>
      </div>

      {tab === 'releases' ? (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Topic</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Released</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{r.title}<div className="text-[10px] text-gray-400 font-mono">{r.slug}</div></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.topic || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.released_at ? formatDate(r.released_at, 'short') : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 ${r.status === 'released' ? 'bg-green-100 text-green-700' : r.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setEditingRel(r)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {spokes.map((s) => (
            <div key={s.id} className="border border-gray-200 p-4">
              <p className="font-medium">{s.name}</p>
              {s.role && <p className="text-xs text-gray-600">{s.role}</p>}
              {s.email && <p className="text-xs text-gray-500 mt-1">{s.email}</p>}
              {s.topics.length > 0 && <p className="text-[10px] text-gray-400 mt-2">Topics: {s.topics.join(', ')}</p>}
              <button onClick={() => setEditingSp(s)} className="text-xs text-gray-500 hover:text-black mt-3">Edit →</button>
            </div>
          ))}
        </div>
      )}

      {editingRel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingRel(null)}>
          <div className="bg-white max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editingRel.id ? 'Edit' : 'New'} release</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editingRel.title} onChange={(e) => setEditingRel({ ...editingRel, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Dateline</span><input value={editingRel.dateline || ''} onChange={(e) => setEditingRel({ ...editingRel, dateline: e.target.value })} placeholder="Cape Town, 19 April 2026" className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Topic</span><input value={editingRel.topic || ''} onChange={(e) => setEditingRel({ ...editingRel, topic: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editingRel.status} onChange={(e) => setEditingRel({ ...editingRel, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="released">Released</option><option value="archived">Archived</option>
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Summary (1-2 sentences for cards)</span><textarea rows={2} value={editingRel.summary || ''} onChange={(e) => setEditingRel({ ...editingRel, summary: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Body (full release text)</span><textarea rows={12} value={editingRel.body || ''} onChange={(e) => setEditingRel({ ...editingRel, body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Released at</span><input type="datetime-local" value={editingRel.released_at?.slice(0, 16) || ''} onChange={(e) => setEditingRel({ ...editingRel, released_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Spokesperson</span>
                  <select value={editingRel.spokesperson_id || ''} onChange={(e) => setEditingRel({ ...editingRel, spokesperson_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="">—</option>{spokes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={saveRelease} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditingRel(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}

      {editingSp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingSp(null)}>
          <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editingSp.id ? 'Edit' : 'New'} spokesperson</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Name *</span><input value={editingSp.name} onChange={(e) => setEditingSp({ ...editingSp, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Role / title</span><input value={editingSp.role || ''} onChange={(e) => setEditingSp({ ...editingSp, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email</span><input value={editingSp.email || ''} onChange={(e) => setEditingSp({ ...editingSp, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Phone</span><input value={editingSp.phone || ''} onChange={(e) => setEditingSp({ ...editingSp, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Bio</span><textarea rows={3} value={editingSp.bio || ''} onChange={(e) => setEditingSp({ ...editingSp, bio: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Topics (comma-separated)</span><input value={editingSp.topics.join(', ')} onChange={(e) => setEditingSp({ ...editingSp, topics: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editingSp.available} onChange={(e) => setEditingSp({ ...editingSp, available: e.target.checked })} />Available for press</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={saveSpokes} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditingSp(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
