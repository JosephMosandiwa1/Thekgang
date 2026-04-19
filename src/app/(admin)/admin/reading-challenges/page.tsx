'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { slugify, supabaseErrorMessage } from '@/lib/utils';

interface Challenge {
  id?: number; slug: string; title: string; description: string | null;
  year: number | null; theme: string | null; target_books: number;
  category_prompts: string[]; starts_at: string | null; ends_at: string | null;
  active: boolean;
}

export default function AdminReadingChallenges() {
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Challenge | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('reading_challenges').select('*').order('year', { ascending: false });
    setItems(((data || []) as unknown) as Challenge[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const record = { ...editing, slug: editing.slug || slugify(editing.title) };
    const { error } = editing.id ? await supabase.from('reading_challenges').update(record).eq('id', editing.id) : await supabase.from('reading_challenges').insert(record);
    if (error) alert(supabaseErrorMessage(error)); else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div><h1 className="text-2xl font-display font-bold">Reading challenges</h1><p className="text-sm text-gray-500 mt-1">Annual reading programme · category prompts · public participation</p></div>
        <button onClick={() => setEditing({ slug: '', title: '', description: null, year: new Date().getFullYear() + 1, theme: null, target_books: 12, category_prompts: [], starts_at: null, ends_at: null, active: true })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New challenge</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((c) => (
          <div key={c.id} className="border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{c.year} · {c.theme || '—'}</p>
            <p className="font-display text-lg font-bold">{c.title}</p>
            <p className="text-xs text-gray-600 mt-1">{c.target_books} books · {c.category_prompts.length} prompts</p>
            <button onClick={() => setEditing(c)} className="text-xs text-gray-500 hover:text-black mt-3">Edit →</button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} challenge</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Year</span><input type="number" value={editing.year ?? ''} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Theme</span><input value={editing.theme || ''} onChange={(e) => setEditing({ ...editing, theme: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Target books</span><input type="number" value={editing.target_books} onChange={(e) => setEditing({ ...editing, target_books: Number(e.target.value) || 12 })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Starts</span><input type="date" value={editing.starts_at || ''} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Ends</span><input type="date" value={editing.ends_at || ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Category prompts (one per line)</span>
                <textarea rows={6} value={editing.category_prompts.join('\n')} onChange={(e) => setEditing({ ...editing, category_prompts: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />Active</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
