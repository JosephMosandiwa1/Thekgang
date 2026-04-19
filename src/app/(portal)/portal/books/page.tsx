'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, supabaseErrorMessage } from '@/lib/utils';

interface Book {
  id?: number; isbn: string | null; title: string; subtitle: string | null;
  author_names: string[]; publisher_name: string | null;
  category: string | null; language: string;
  format: string[]; published_date: string | null;
  cover_image_url: string | null; description: string | null;
  cover_price_rands: number | null; public: boolean;
}

const EMPTY: Book = {
  isbn: null, title: '', subtitle: null,
  author_names: [], publisher_name: null,
  category: null, language: 'en',
  format: ['print'], published_date: null,
  cover_image_url: null, description: null,
  cover_price_rands: null, public: true,
};

export default function PortalBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Book | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id, full_name').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const mem = m as { id: number; full_name: string };
      setMemberId(mem.id);
      setMemberName(mem.full_name);
      const { data: b } = await supabase.from('books').select('*').eq('created_by_member_id', mem.id).order('published_date', { ascending: false, nullsFirst: false });
      setBooks(((b || []) as unknown) as Book[]);
    }
    setLoading(false);
  }

  async function save() {
    if (!supabase || !memberId || !editing) return;
    const record = { ...editing, created_by_member_id: memberId };
    const { error } = editing.id
      ? await supabase.from('books').update(record).eq('id', editing.id)
      : await supabase.from('books').insert(record);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Your books</p>
          <h1 className="font-display text-3xl font-bold">Book catalogue</h1>
          <p className="text-gray-600 mt-2 max-w-2xl text-sm">Register your titles in the Council catalogue. Public entries appear in the <Link href="/books" className="underline">public books page</Link>.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY, author_names: [memberName] })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Add book</button>
      </div>

      {books.length === 0 ? <p className="text-sm text-gray-500">No books registered yet.</p> : (
        <div className="grid md:grid-cols-3 gap-4">
          {books.map((b) => (
            <div key={b.id} className="border border-gray-200 p-4">
              <p className="font-display font-bold">{b.title}</p>
              {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
              <p className="text-xs mt-2">{b.author_names.join(', ')}</p>
              <p className="text-[10px] text-gray-500 mt-1">{b.publisher_name || 'Self-published'} · {b.published_date ? formatDate(b.published_date, 'short') : '—'}</p>
              {b.cover_price_rands && <p className="text-xs font-mono mt-1">{formatRand(b.cover_price_rands)}</p>}
              <button onClick={() => setEditing(b)} className="text-xs text-gray-500 hover:text-black mt-3">Edit →</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'Register'} book</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Authors (comma-separated)</span><input value={editing.author_names.join(', ')} onChange={(e) => setEditing({ ...editing, author_names: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Publisher</span><input value={editing.publisher_name || ''} onChange={(e) => setEditing({ ...editing, publisher_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">ISBN</span><input value={editing.isbn || ''} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Published date</span><input type="date" value={editing.published_date || ''} onChange={(e) => setEditing({ ...editing, published_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Price (ZAR)</span><input type="number" value={editing.cover_price_rands ?? ''} onChange={(e) => setEditing({ ...editing, cover_price_rands: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Cover image URL</span><input value={editing.cover_image_url || ''} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.public} onChange={(e) => setEditing({ ...editing, public: e.target.checked })} />Show on public catalogue</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
