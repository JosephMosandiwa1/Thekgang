'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, supabaseErrorMessage } from '@/lib/utils';

interface Book {
  id?: number; isbn: string | null; title: string; subtitle: string | null;
  author_names: string[]; illustrator_names: string[]; translator_names: string[];
  publisher_name: string | null; publisher_org_id: number | null;
  genre: string | null; category: string | null; language: string; age_range: string | null;
  format: string[]; page_count: number | null; published_date: string | null;
  cover_image_url: string | null; description: string | null;
  cover_price_rands: number | null;
  awards: string[]; featured: boolean; public: boolean;
}

const CATEGORIES = ['adult_fiction', 'adult_non_fiction', 'childrens', 'youth_adult', 'academic', 'poetry', 'short_stories', 'memoir', 'reference', 'educational', 'other'];
const FORMATS = ['print', 'ebook', 'audio', 'braille'];

const EMPTY: Book = {
  isbn: null, title: '', subtitle: null,
  author_names: [], illustrator_names: [], translator_names: [],
  publisher_name: null, publisher_org_id: null,
  genre: null, category: null, language: 'en', age_range: null,
  format: ['print'], page_count: null, published_date: null,
  cover_image_url: null, description: null,
  cover_price_rands: null, awards: [], featured: false, public: true,
};

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Book | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('books').select('*').order('published_date', { ascending: false, nullsFirst: false }).limit(500);
    setBooks((data || []) as Book[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const { error } = editing.id
      ? await supabase.from('books').update(editing).eq('id', editing.id)
      : await supabase.from('books').insert(editing);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  const filtered = books.filter((b) => !q.trim() || b.title.toLowerCase().includes(q.toLowerCase()) || b.author_names.some((a) => a.toLowerCase().includes(q.toLowerCase())) || b.isbn?.includes(q));

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Book catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Sector-wide bibliography · SA publishing</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Add book</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author, ISBN…" className="w-full md:max-w-md px-3 py-2 border border-gray-200 text-sm mb-4" />

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Author</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Publisher</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">ISBN</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Published</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{b.title}{b.subtitle && <div className="text-[10px] text-gray-400">{b.subtitle}</div>}</td>
                <td className="px-4 py-3 text-xs">{b.author_names.join(', ') || '—'}</td>
                <td className="px-4 py-3 text-xs">{b.publisher_name || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono">{b.isbn || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{b.published_date ? formatDate(b.published_date, 'short') : '—'}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(b)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} book</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Subtitle</span><input value={editing.subtitle || ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">ISBN</span><input value={editing.isbn || ''} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Language</span><input value={editing.language} onChange={(e) => setEditing({ ...editing, language: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Category</span>
                  <select value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="">—</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Authors (comma-separated)</span><input value={editing.author_names.join(', ')} onChange={(e) => setEditing({ ...editing, author_names: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Publisher name</span><input value={editing.publisher_name || ''} onChange={(e) => setEditing({ ...editing, publisher_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Published date</span><input type="date" value={editing.published_date || ''} onChange={(e) => setEditing({ ...editing, published_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Pages</span><input type="number" value={editing.page_count ?? ''} onChange={(e) => setEditing({ ...editing, page_count: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Cover price (ZAR)</span><input type="number" value={editing.cover_price_rands ?? ''} onChange={(e) => setEditing({ ...editing, cover_price_rands: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Formats</span>
                <div className="flex gap-2 flex-wrap">
                  {FORMATS.map((f) => (
                    <button key={f} type="button" onClick={() => setEditing({ ...editing, format: editing.format.includes(f) ? editing.format.filter((x) => x !== f) : [...editing.format, f] })} className={`px-3 py-1.5 text-xs border ${editing.format.includes(f) ? 'bg-black text-white border-black' : 'border-gray-300'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Cover image URL</span><input value={editing.cover_image_url || ''} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.public} onChange={(e) => setEditing({ ...editing, public: e.target.checked })} />Public</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />Featured</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
