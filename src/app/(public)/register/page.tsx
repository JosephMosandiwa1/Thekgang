'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Work {
  id: number;
  title: string;
  subtitle: string | null;
  work_type: string;
  author_name: string;
  publisher: string | null;
  isbn: string | null;
  first_published_at: string | null;
  format: string[];
  language: string;
  verified: boolean;
  verification_code: string | null;
}

export default function PublicRegisterPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('copyright_register')
        .select('id, title, subtitle, work_type, author_name, publisher, isbn, first_published_at, format, language, verified, verification_code')
        .eq('public', true)
        .order('first_published_at', { ascending: false, nullsFirst: false })
        .limit(500);
      setWorks(((data || []) as unknown) as Work[]);
      setLoading(false);
    })();
  }, []);

  const filtered = works.filter((w) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      w.title.toLowerCase().includes(needle) ||
      w.author_name.toLowerCase().includes(needle) ||
      w.publisher?.toLowerCase().includes(needle) ||
      w.isbn?.includes(needle)
    );
  });

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Public register</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-6" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          Copyright register
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          A public register of works whose creators are enrolled members of the Council. Search by title, author, publisher, or ISBN. Each entry can be verified against the Council record.
        </p>

        <input
          type="search"
          placeholder="Search the register…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-lg px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black mb-8"
        />

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No works match your search.</p>
        ) : (
          <div className="border-t border-gray-200">
            {filtered.map((w) => (
              <div key={w.id} className="py-5 border-b border-gray-200 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-0.5">{w.work_type.replace(/_/g, ' ')} · {w.language}</p>
                  <h3 className="font-display text-lg font-bold">{w.title}</h3>
                  {w.subtitle && <p className="text-sm text-gray-600">{w.subtitle}</p>}
                  <p className="text-sm mt-1">by <strong>{w.author_name}</strong></p>
                  {w.publisher && <p className="text-xs text-gray-500">{w.publisher}</p>}
                  <div className="flex gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                    {w.isbn && <span className="font-mono">ISBN: {w.isbn}</span>}
                    {w.first_published_at && <span>Published: {formatDate(w.first_published_at, 'short')}</span>}
                    {w.format.length > 0 && <span>Formats: {w.format.join(', ')}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {w.verified && <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 mb-2 inline-block">Verified</span>}
                  {w.verification_code && <p className="text-[10px] text-gray-400 font-mono">{w.verification_code}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Register your work</h3>
          <p className="text-sm text-gray-600 mb-4">Council members can register works for free. The register supplements — it does not replace — statutory copyright registration.</p>
          <Link href="/portal/copyright" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white transition-colors">
            Go to portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
