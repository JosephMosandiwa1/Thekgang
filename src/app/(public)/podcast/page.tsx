'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Episode { id: number; title: string; description: string; guest_name: string; guest_title: string; audio_url: string; duration_minutes: number; episode_number: number; season: number }

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('podcast_episodes').select('*').eq('published', true).order('episode_number', { ascending: false });
    setEpisodes((data || []) as Episode[]);
    setLoading(false);
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Podcast</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>Thekgang Talking.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Conversations with the people who move SA&apos;s book industry. <Link href="/news" className="link-draw text-black inline-block">Or read our news &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? <p className="text-sm text-gray-500 text-center py-12">Loading...</p> : episodes.length === 0 ? (
            <div className="border border-gray-200 rounded p-16 text-center bg-white">
              <h2 className="font-display text-2xl font-bold text-black mb-3">Coming soon.</h2>
              <p className="text-sm text-gray-500 mb-6">Thekgang Talking is in production.</p>
              <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3">Join the registry to be notified</Link>
            </div>
          ) : episodes.map(ep => (
            <div key={ep.id} className="py-8 border-b border-gray-200 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] text-gray-500 font-mono font-semibold">S{ep.season}E{ep.episode_number}</span>
                {ep.duration_minutes && <span className="text-[10px] text-gray-500">{ep.duration_minutes} min</span>}
              </div>
              <h2 className="font-display text-2xl font-bold text-black type-card-title mb-2">{ep.title}</h2>
              {ep.guest_name && <p className="text-sm text-gray-500">with {ep.guest_name}{ep.guest_title ? ` — ${ep.guest_title}` : ''}</p>}
              {ep.description && <p className="text-sm text-gray-500 leading-relaxed mt-3">{ep.description}</p>}
              {ep.audio_url && <audio controls className="w-full mt-4" preload="none"><source src={ep.audio_url} /></audio>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
