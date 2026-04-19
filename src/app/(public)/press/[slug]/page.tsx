'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Release {
  id: number; slug: string; title: string; dateline: string | null;
  summary: string | null; body: string | null; topic: string | null;
  released_at: string | null; embargoed_until: string | null;
  press_kit_url: string | null;
  press_spokespeople?: { name: string; role: string | null; email: string | null } | null;
}

export default function PressRelease({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [r, setR] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('press_releases')
        .select('*, press_spokespeople:spokesperson_id(name, role, email)')
        .eq('slug', slug)
        .eq('status', 'released')
        .maybeSingle();
      setR(data as Release | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="pt-28 pb-20 px-6 text-center text-sm text-gray-500">Loading…</div>;
  if (!r) return (
    <div className="pt-28 pb-20 px-6 text-center">
      <p className="text-sm text-gray-500 mb-4">Release not found.</p>
      <Link href="/press" className="text-sm underline">← Back to press room</Link>
    </div>
  );

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/press" className="text-xs text-gray-500 hover:text-black">← Press room</Link>
        {r.released_at && <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mt-6 mb-3">{r.topic ? `${r.topic} · ` : ''}Released {formatDate(r.released_at, 'long')}</p>}
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>{r.title}</h1>
        {r.dateline && <p className="text-sm text-gray-600 mt-4 font-mono">{r.dateline}</p>}
        {r.summary && <p className="text-lg text-gray-700 mt-6">{r.summary}</p>}
        {r.body && <div className="mt-10 prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">{r.body}</div>}

        {r.press_spokespeople && (
          <div className="mt-12 border-t border-gray-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">For media enquiries</p>
            <p className="font-medium">{r.press_spokespeople.name}</p>
            {r.press_spokespeople.role && <p className="text-sm text-gray-600">{r.press_spokespeople.role}</p>}
            {r.press_spokespeople.email && <a href={`mailto:${r.press_spokespeople.email}`} className="text-sm text-black underline">{r.press_spokespeople.email}</a>}
          </div>
        )}

        {r.press_kit_url && (
          <div className="mt-6">
            <a href={r.press_kit_url} className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">Download press kit →</a>
          </div>
        )}
      </div>
    </div>
  );
}
