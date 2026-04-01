'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Episode { id: number; title: string; description: string; guest_name: string; guest_title: string; audio_url: string; duration_minutes: number; episode_number: number; season: number; published_at: string }

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
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold mb-3">Podcast</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-2">Thekgang Talking</h1>
        <p className="text-sm text-gray-500 max-w-xl mb-12">
          Conversations with the people who make South Africa&apos;s book industry move — authors, publishers, printers, distributors, and everyone in between.
        </p>

        {loading ? <p className="text-sm text-gray-500/50 text-center py-12">Loading...</p> : episodes.length === 0 ? (
          <div className="border border-gray-200/50 rounded p-12 text-center bg-white">
            <p className="font-display text-lg text-black mb-2">Coming soon.</p>
            <p className="text-xs text-gray-500/50">Thekgang Talking is in production. Subscribe to our newsletter to know when the first episode drops.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {episodes.map(ep => (
              <div key={ep.id} className="border border-gray-200/50 rounded p-8 bg-white hover:border-black/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] text-black font-mono font-semibold">S{ep.season}E{ep.episode_number}</span>
                      {ep.duration_minutes && <span className="text-[10px] text-gray-500/50">{ep.duration_minutes} min</span>}
                    </div>
                    <h3 className="font-display text-xl font-bold text-black">{ep.title}</h3>
                    {ep.guest_name && <p className="text-sm text-black mt-1">with {ep.guest_name}{ep.guest_title ? ` — ${ep.guest_title}` : ''}</p>}
                  </div>
                </div>
                {ep.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{ep.description}</p>}
                {ep.audio_url && (
                  <audio controls className="w-full mt-2" preload="none">
                    <source src={ep.audio_url} />
                  </audio>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
