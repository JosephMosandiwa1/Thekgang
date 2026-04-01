'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Episode { id: number; title: string; guest_name: string; guest_title: string; episode_number: number; season: number; duration_minutes: number; published: boolean; published_at: string }

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('podcast_episodes').select('*').order('episode_number', { ascending: false });
    setEpisodes((data || []) as Episode[]);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Thekgang Talking</h1>
          <p className="text-sm text-muted mt-1">Podcast episodes — interviews from across the book value chain</p>
        </div>
        <button className="bg-accent text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-accent-light transition-colors">+ New Episode</button>
      </div>

      <div className="space-y-4">
        {episodes.length === 0 ? (
          <div className="border border-sand/60 rounded px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No episodes yet — record and publish your first episode'}</div>
        ) : episodes.map(ep => (
          <div key={ep.id} className="border border-sand/60 rounded p-5 hover:border-accent/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-accent font-mono">S{ep.season}E{ep.episode_number}</span>
                  {ep.duration_minutes && <span className="text-[10px] text-muted">{ep.duration_minutes} min</span>}
                </div>
                <h3 className="text-base font-semibold text-ink">{ep.title}</h3>
                {ep.guest_name && <p className="text-xs text-muted mt-1">Guest: {ep.guest_name}{ep.guest_title ? ` — ${ep.guest_title}` : ''}</p>}
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${ep.published ? 'border-green-500/30 text-green-700' : 'border-sand/60 text-muted'}`}>{ep.published ? 'Published' : 'Draft'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
