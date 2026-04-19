'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand } from '@/lib/utils';

interface Book {
  id: number; isbn: string | null; title: string; subtitle: string | null;
  author_names: string[]; publisher_name: string | null;
  category: string | null; language: string; age_range: string | null;
  format: string[]; published_date: string | null;
  cover_image_url: string | null; description: string | null;
  cover_price_rands: number | null;
  featured: boolean;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('books').select('*').eq('public', true).order('published_date', { ascending: false, nullsFirst: false }).limit(200);
      setBooks(((data || []) as unknown) as Book[]);
      setLoading(false);
    })();
  }, []);

  const categories = Array.from(new Set(books.map((b) => b.category).filter(Boolean))) as string[];
  const filtered = books.filter((b) => {
    if (category && b.category !== category) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return b.title.toLowerCase().includes(needle) || b.author_names.some((a) => a.toLowerCase().includes(needle)) || b.isbn?.includes(needle) || (b.publisher_name?.toLowerCase().includes(needle) ?? false);
  });

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Catalogue</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Books.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-8">
          South African books in the Council catalogue. Fiction, non-fiction, poetry, children&apos;s — across 11 languages.
        </p>

        <div className="flex gap-3 mb-8 flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author, ISBN…" className="px-3 py-2 border border-gray-300 text-sm min-w-[280px]" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-gray-300 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading…</p> : filtered.length === 0 ? <p className="text-sm text-gray-500">No books match.</p> : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((b) => (
              <div key={b.id} className="border border-gray-200">
                {b.cover_image_url ? <img src={b.cover_image_url} alt={b.title} className="w-full aspect-[2/3] object-cover" /> : <div className="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-xs text-gray-400">No cover</div>}
                <div className="p-3">
                  <p className="font-display font-bold text-sm leading-tight">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-gray-500 mt-0.5">{b.subtitle}</p>}
                  <p className="text-xs mt-1">{b.author_names.join(', ')}</p>
                  {b.publisher_name && <p className="text-[10px] text-gray-500 mt-1">{b.publisher_name}</p>}
                  <div className="flex items-center justify-between mt-2">
                    {b.cover_price_rands && <span className="text-xs font-mono">{formatRand(b.cover_price_rands)}</span>}
                    {b.format.length > 0 && <span className="text-[10px] text-gray-500">{b.format.join(' · ')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Your book not here?</h3>
          <p className="text-sm text-gray-600 mb-4">Members can register their titles in the Council catalogue.</p>
          <Link href="/portal/books" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">Portal → register a book</Link>
        </div>
      </div>
    </div>
  );
}
