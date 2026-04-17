'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function SubEventsSection({ event }: SectionProps) {
  const [subEvents, setSubEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<Record<string, string>>({ day: 'All', type: 'All', venue: 'All', age_group: 'All' });

  useEffect(() => {
    supabase!.from('event_sub_events').select('*').eq('event_id', event.id).order('event_date').order('event_time').then(({ data }) => {
      if (data) setSubEvents(data);
    });
  }, [event.id]);

  if (!subEvents.length) return null;

  const unique = (key: string) => ['All', ...Array.from(new Set(subEvents.map(e => e[key]).filter(Boolean)))];
  const filterKeys = ['day', 'type', 'venue', 'age_group'] as const;

  const filtered = subEvents.filter(se => {
    if (filter.type !== 'All' && se.type !== filter.type) return false;
    if (filter.venue !== 'All' && se.venue !== filter.venue) return false;
    if (filter.age_group !== 'All' && se.age_group !== filter.age_group) return false;
    if (filter.day !== 'All' && se.event_date !== filter.day) return false;
    return true;
  });

  return (
    <section id="sub_events" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Programme</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">What&apos;s On</h2>

        <div className="flex flex-wrap gap-4 mb-8">
          {filterKeys.map(key => {
            const options = unique(key === 'day' ? 'event_date' : key);
            if (options.length <= 2) return null;
            return (
              <select key={key} value={filter[key]} onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))} className="text-xs border border-gray-200 rounded px-3 py-2 bg-white focus:outline-none">
                {options.map(o => <option key={o} value={o}>{key === 'day' && o !== 'All' ? new Date(o).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }) : o}</option>)}
              </select>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(se => (
            <div key={se.id} className="bg-white rounded-lg border border-gray-200 p-5 card-hover">
              <div className="flex items-center gap-2 mb-2">
                {se.event_date && <span className="text-[9px] uppercase tracking-wider text-black/30">{new Date(se.event_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' })}</span>}
                {se.event_time && <span className="font-mono text-[10px] text-black/30">{se.event_time?.slice(0, 5)}</span>}
              </div>
              <h3 className="font-display text-base font-semibold text-black">{se.title}</h3>
              {se.venue && <p className="text-xs text-black/40 mt-1">{se.venue}</p>}
              {se.description && <p className="text-sm text-black/60 leading-relaxed mt-2 line-clamp-3">{se.description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {se.type && <span className="text-[9px] uppercase tracking-wider text-black/30 px-2 py-0.5 border border-black/10 rounded">{se.type}</span>}
                {se.age_group && <span className="text-[9px] uppercase tracking-wider text-black/30 px-2 py-0.5 border border-black/10 rounded">{se.age_group}</span>}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && <p className="text-center text-sm text-black/40 py-12">No events match these filters.</p>}
      </div>
    </section>
  );
}
