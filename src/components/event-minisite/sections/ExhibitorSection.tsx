'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function ExhibitorSection({ event }: SectionProps) {
  const [exhibitors, setExhibitors] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase!.from('event_exhibitors').select('*').eq('event_id', event.id).order('name').then(({ data }) => {
      if (data) setExhibitors(data);
    });
  }, [event.id]);

  if (!exhibitors.length) return null;

  const types = ['All', ...Array.from(new Set(exhibitors.map(e => e.exhibitor_type).filter(Boolean)))];
  const filtered = filter === 'All' ? exhibitors : exhibitors.filter(e => e.exhibitor_type === filter);

  return (
    <section id="exhibitors" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Exhibitors</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Exhibitors</h2>

        {types.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`text-[10px] uppercase tracking-[0.15em] px-4 py-2 rounded-full border transition-colors ${filter === t ? 'bg-black text-white border-black' : 'border-black/10 text-black/50 hover:border-black/30'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="bg-white border border-gray-200 rounded-lg p-5 card-hover">
              <div className="flex items-start gap-4">
                {ex.logo_url && <img src={ex.logo_url} alt={ex.name} className="w-12 h-12 object-contain rounded shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-black truncate">{ex.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {ex.exhibitor_type && <span className="text-[9px] uppercase tracking-wider text-black/30 px-2 py-0.5 border border-black/10 rounded">{ex.exhibitor_type}</span>}
                    {ex.booth_number && <span className="text-[9px] text-black/30">Booth {ex.booth_number}</span>}
                  </div>
                </div>
              </div>
              {ex.description && (
                <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)} className="text-[10px] uppercase tracking-wider text-black/40 hover:text-black mt-3 link-draw">
                  {expanded === ex.id ? 'Less' : 'More'}
                </button>
              )}
              {expanded === ex.id && ex.description && (
                <p className="text-sm text-black/70 leading-relaxed mt-3">{ex.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
