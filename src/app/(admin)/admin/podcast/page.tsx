'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Episode { id: number; title: string; guest_name: string; guest_title: string; episode_number: number; season: number; duration_minutes: number; published: boolean; published_at: string; description: string; audio_url: string }

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [form, setForm] = useState({ title: '', guest_name: '', guest_title: '', season: '1', episode_number: '', duration_minutes: '', description: '', audio_url: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('podcast_episodes').select('*').order('episode_number', { ascending: false });
    setEpisodes((data || []) as Episode[]);
    setLoading(false);
  }

  function openNew() {
    const nextEp = episodes.length > 0 ? Math.max(...episodes.map(e => e.episode_number)) + 1 : 1;
    setEditing(null);
    setForm({ title: '', guest_name: '', guest_title: '', season: '1', episode_number: String(nextEp), duration_minutes: '', description: '', audio_url: '' });
    setShowForm(true);
  }

  function openEdit(ep: Episode) {
    setEditing(ep);
    setForm({ title: ep.title, guest_name: ep.guest_name || '', guest_title: ep.guest_title || '', season: String(ep.season || 1), episode_number: String(ep.episode_number), duration_minutes: String(ep.duration_minutes || ''), description: ep.description || '', audio_url: ep.audio_url || '' });
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !form.title) return;
    const record = { title: form.title, guest_name: form.guest_name || null, guest_title: form.guest_title || null, season: parseInt(form.season) || 1, episode_number: parseInt(form.episode_number) || 1, duration_minutes: parseInt(form.duration_minutes) || null, description: form.description || null, audio_url: form.audio_url || null };
    if (editing) {
      await supabase.from('podcast_episodes').update(record).eq('id', editing.id);
    } else {
      await supabase.from('podcast_episodes').insert({ ...record, published: false });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function togglePublish(ep: Episode) {
    if (!supabase) return;
    await supabase.from('podcast_episodes').update({ published: !ep.published, published_at: !ep.published ? new Date().toISOString() : null }).eq('id', ep.id);
    load();
  }

  async function handleDelete(ep: Episode) {
    if (!supabase || !confirm(`Delete S${ep.season}E${ep.episode_number} "${ep.title}"?`)) return;
    await supabase.from('podcast_episodes').delete().eq('id', ep.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Zibonele</h1>
          <p className="text-sm text-gray-500 mt-1">Podcast episodes — interviews from across the content creation sector</p>
        </div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors">+ New Episode</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Episodes</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : episodes.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Published</p><p className="text-2xl font-bold mt-1 text-green-700">{episodes.filter(e => e.published).length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Drafts</p><p className="text-2xl font-bold mt-1 text-black">{episodes.filter(e => !e.published).length}</p></div>
      </div>

      <div className="space-y-4">
        {episodes.length === 0 ? (
          <div className="border border-gray-200/60 rounded px-6 py-12 text-center text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No episodes yet — record and publish your first'}</div>
        ) : episodes.map(ep => (
          <div key={ep.id} className="border border-gray-200/60 rounded p-5 hover:border-black/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => openEdit(ep)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-black font-mono">S{String(ep.season).padStart(2, '0')}E{String(ep.episode_number).padStart(2, '0')}</span>
                  {ep.duration_minutes && <span className="text-[10px] text-gray-500">{ep.duration_minutes} min</span>}
                </div>
                <h3 className="text-base font-semibold text-black hover:underline">{ep.title}</h3>
                {ep.guest_name && <p className="text-xs text-gray-500 mt-1">Guest: {ep.guest_name}{ep.guest_title ? ` — ${ep.guest_title}` : ''}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => togglePublish(ep)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${ep.published ? 'border-amber-500/30 text-amber-700 hover:bg-amber-50' : 'border-green-500/30 text-green-700 hover:bg-green-50'}`}>
                  {ep.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleDelete(ep)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Episode' : 'New Episode'}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Episode title" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} placeholder="Guest name" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.guest_title} onChange={e => setForm(f => ({ ...f, guest_title: e.target.value }))} placeholder="Guest title / role" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} placeholder="Season" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.episode_number} onChange={e => setForm(f => ({ ...f, episode_number: e.target.value }))} placeholder="Episode #" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="Duration (min)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Episode description" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <input value={form.audio_url} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))} placeholder="Audio URL (mp3 link)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">{editing ? 'Save Changes' : 'Create'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
