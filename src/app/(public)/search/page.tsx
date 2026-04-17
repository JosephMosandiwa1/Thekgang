'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PostResult { id: number; slug: string; title: string; category: string | null; meta_description: string | null; published_at: string }
interface EventResult { id: number; slug: string | null; title: string; event_date: string; venue: string | null; description: string | null }
interface PageResult { id: number; slug: string; title: string; meta_description: string | null }

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [pages, setPages] = useState<PageResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setEvents(data.events ?? []);
      setPages(data.pages ?? []);
    } catch {
      setPosts([]); setEvents([]); setPages([]);
    }
    setSearched(true);
    setLoading(false);
  }

  const total = posts.length + events.length + pages.length;

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Search</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-8" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
          Find anything.
        </h1>

        <form onSubmit={doSearch} className="flex gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, events, pages…"
            className="flex-1 px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold px-6 py-3 rounded hover:bg-black/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searched && total === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No results found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-gray-400">Try a different keyword or browse our <Link href="/news" className="text-black underline">news</Link> and <Link href="/events" className="text-black underline">events</Link>.</p>
          </div>
        )}

        {posts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-semibold mb-4">News & Stories · {posts.length} result{posts.length === 1 ? '' : 's'}</h2>
            {posts.map((p) => (
              <Link key={p.id} href={`/news/${p.slug}`} className="block py-4 border-b border-gray-100 hover:bg-gray-50/50 -mx-2 px-2 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  {p.category && <span className="text-[10px] uppercase tracking-wider text-gray-400">{p.category.replace('_', ' ')}</span>}
                  <span className="text-[10px] text-gray-400">{new Date(p.published_at).toLocaleDateString('en-ZA')}</span>
                </div>
                <h3 className="text-sm font-semibold text-black">{p.title}</h3>
                {p.meta_description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.meta_description}</p>}
              </Link>
            ))}
          </section>
        )}

        {events.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-semibold mb-4">Events · {events.length} result{events.length === 1 ? '' : 's'}</h2>
            {events.map((ev) => (
              <Link key={ev.id} href={`/events/${ev.slug || ev.id}`} className="block py-4 border-b border-gray-100 hover:bg-gray-50/50 -mx-2 px-2 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-gray-400">{new Date(ev.event_date).toLocaleDateString('en-ZA')}</span>
                  {ev.venue && <span className="text-[10px] text-gray-400">· {ev.venue}</span>}
                </div>
                <h3 className="text-sm font-semibold text-black">{ev.title}</h3>
              </Link>
            ))}
          </section>
        )}

        {pages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-semibold mb-4">Pages · {pages.length} result{pages.length === 1 ? '' : 's'}</h2>
            {pages.map((pg) => (
              <Link key={pg.id} href={`/${pg.slug}`} className="block py-4 border-b border-gray-100 hover:bg-gray-50/50 -mx-2 px-2 transition-colors">
                <h3 className="text-sm font-semibold text-black">{pg.title}</h3>
                {pg.meta_description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pg.meta_description}</p>}
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
