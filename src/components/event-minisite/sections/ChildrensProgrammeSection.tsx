'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function ChildrensProgrammeSection({ event }: SectionProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase!.from('event_sub_events').select('*').eq('event_id', event.id).in('age_group', ['children', 'teens']).order('event_date').order('event_time').then(({ data }) => {
      if (data) setItems(data);
    });
  }, [event.id]);

  if (!items.length) return null;

  return (
    <section id="childrens_programme" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Young Readers</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4 type-grow">Children&apos;s Programme</h2>
        <p className="text-base text-black/50 mb-12">Activities for young people and teens.</p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border-2 border-gray-200 p-5 card-hover bg-gray-50 hover:border-black/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white font-medium">{item.age_group}</span>
                {item.event_time && <span className="font-mono text-[10px] text-black/30">{item.event_time?.slice(0, 5)}</span>}
              </div>
              <h3 className="font-display text-base font-semibold text-black">{item.title}</h3>
              {item.venue && <p className="text-xs text-black/40 mt-1">{item.venue}</p>}
              {item.description && <p className="text-sm text-black/60 leading-relaxed mt-2">{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
