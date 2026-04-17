'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function HighlightsSection({ event }: SectionProps) {
  const [highlights, setHighlights] = useState<any[]>([]);

  useEffect(() => {
    supabase!.from('event_sub_events').select('*').eq('event_id', event.id).eq('is_highlight', true).order('event_date').order('event_time').then(({ data }) => {
      if (data) setHighlights(data);
    });
  }, [event.id]);

  if (!highlights.length) return null;

  return (
    <section id="highlights" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Highlights</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4 type-grow">Don&apos;t Miss</h2>
        <p className="text-base text-black/50 mb-12">Our curated picks from the programme.</p>

        <div className="grid sm:grid-cols-2 gap-6">
          {highlights.map(h => (
            <div key={h.id} className="relative bg-black text-white rounded-lg p-6 overflow-hidden card-hover group">
              <div className="absolute top-0 right-0 bg-white text-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-bl font-semibold">
                Must See
              </div>
              <div className="flex items-center gap-2 mb-3">
                {h.event_date && <span className="text-[9px] uppercase tracking-wider text-white/40">{new Date(h.event_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
                {h.event_time && <span className="font-mono text-[10px] text-white/40">{h.event_time?.slice(0, 5)}</span>}
              </div>
              <h3 className="font-display text-xl font-semibold">{h.title}</h3>
              {h.venue && <p className="text-xs text-white/40 mt-1">{h.venue}</p>}
              {h.description && <p className="text-sm text-white/60 leading-relaxed mt-3">{h.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
