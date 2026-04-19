'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchRow {
  kind: string;
  id: number;
  slug: string | null;
  title: string;
  snippet: string | null;
  extra: Record<string, unknown> | null;
  rank: number;
}

const KIND_LABELS: Record<string, string> = {
  post: 'News & Stories',
  event: 'Events',
  book: 'Books',
  job: 'Jobs',
  consultation: 'Consultations',
  page: 'Pages',
};

const KIND_ORDER = ['post', 'event', 'book', 'job', 'consultation', 'page'];

function linkFor(row: SearchRow): string {
  switch (row.kind) {
    case 'post': return `/news/${row.slug}`;
    case 'event': return `/events/${row.slug || row.id}`;
    case 'book': return `/books/${row.id}`;
    case 'job': return `/jobs/${row.slug || row.id}`;
    case 'consultation': return `/consultations/${row.slug}`;
    case 'page': return `/${row.slug}`;
    default: return '#';
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [kindFilter, setKindFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState('');

  async function doSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setCurrentQ(q);
    try {
      const params = new URLSearchParams({ q });
      if (kindFilter) params.set('kind', kindFilter);
      if (languageFilter) params.set('language', languageFilter);
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    }
    setSearched(true);
    setLoading(false);
  }

  async function applyFacet(newKind: string, newLang: string) {
    setKindFilter(newKind);
    setLanguageFilter(newLang);
    if (!currentQ) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: currentQ });
      if (newKind) params.set('kind', newKind);
      if (newLang) params.set('language', newLang);
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const grouped = results.reduce<Record<string, SearchRow[]>>((acc, r) => {
    if (!acc[r.kind]) acc[r.kind] = [];
    acc[r.kind].push(r);
    return acc;
  }, {});

  const orderedKinds = KIND_ORDER.filter((k) => grouped[k]);
  const languagesPresent = Array.from(new Set(
    results
      .filter((r) => r.kind === 'book')
      .map((r) => (r.extra?.language as string) || '')
      .filter(Boolean)
  ));

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Search</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-8" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
          Find anything.
        </h1>

        <form onSubmit={doSearch} className="flex gap-3 mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, events, books, jobs, consultations…"
            className="flex-1 px-4 py-3 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            aria-label="Search query"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold px-6 py-3 rounded hover:bg-black/90 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searched && results.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mr-2">Filter:</span>
            <button
              onClick={() => applyFacet('', languageFilter)}
              className={`text-xs px-3 py-1.5 border ${kindFilter === '' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
            >
              All · {results.length}
            </button>
            {KIND_ORDER.filter((k) => grouped[k] || k === kindFilter).map((k) => (
              <button
                key={k}
                onClick={() => applyFacet(k, languageFilter)}
                className={`text-xs px-3 py-1.5 border ${kindFilter === k ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
              >
                {KIND_LABELS[k]} {grouped[k] ? `· ${grouped[k].length}` : ''}
              </button>
            ))}
            {languagesPresent.length > 0 && (
              <>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 ml-4 mr-2">Language:</span>
                <button
                  onClick={() => applyFacet(kindFilter, '')}
                  className={`text-xs px-3 py-1.5 border ${languageFilter === '' ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                >
                  Any
                </button>
                {languagesPresent.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => applyFacet(kindFilter, lang)}
                    className={`text-xs px-3 py-1.5 border uppercase ${languageFilter === lang ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                  >
                    {lang}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {searched && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No results found for &ldquo;{currentQ}&rdquo;</p>
            <p className="text-xs text-gray-400">Try a different keyword or browse our <Link href="/news" className="text-black underline">news</Link> and <Link href="/events" className="text-black underline">events</Link>.</p>
          </div>
        )}

        {orderedKinds.map((kind) => (
          <section key={kind} className="mb-10">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-black/40 font-semibold mb-4">
              {KIND_LABELS[kind]} · {grouped[kind].length} result{grouped[kind].length === 1 ? '' : 's'}
            </h2>
            {grouped[kind].map((r) => {
              const extra = r.extra || {};
              return (
                <Link
                  key={`${r.kind}-${r.id}`}
                  href={linkFor(r)}
                  className="block py-4 border-b border-gray-100 hover:bg-gray-50/50 -mx-2 px-2 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10 rounded"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {kind === 'post' && typeof extra.category === 'string' && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">{String(extra.category).replace('_', ' ')}</span>
                    )}
                    {kind === 'post' && typeof extra.published_at === 'string' && (
                      <span className="text-[10px] text-gray-400">{new Date(extra.published_at).toLocaleDateString('en-ZA')}</span>
                    )}
                    {kind === 'event' && typeof extra.event_date === 'string' && (
                      <span className="text-[10px] text-gray-400">{new Date(extra.event_date).toLocaleDateString('en-ZA')}</span>
                    )}
                    {kind === 'event' && typeof extra.venue === 'string' && (
                      <span className="text-[10px] text-gray-400">· {extra.venue}</span>
                    )}
                    {kind === 'book' && Array.isArray(extra.authors) && extra.authors.length > 0 && (
                      <span className="text-[10px] text-gray-400">{(extra.authors as string[]).join(', ')}</span>
                    )}
                    {kind === 'book' && typeof extra.language === 'string' && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">· {extra.language}</span>
                    )}
                    {kind === 'job' && typeof extra.employer === 'string' && (
                      <span className="text-[10px] text-gray-400">{extra.employer}</span>
                    )}
                    {kind === 'job' && typeof extra.location === 'string' && (
                      <span className="text-[10px] text-gray-400">· {extra.location}</span>
                    )}
                    {kind === 'consultation' && typeof extra.status === 'string' && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">{extra.status}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-black">{r.title}</h3>
                  {r.snippet && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.snippet}</p>}
                </Link>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
