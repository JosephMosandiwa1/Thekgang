'use client';

import { useState } from 'react';
import type { SectionProps } from '../SectionRegistry';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const FILTERS = ['All', 'Keynote', 'Panel', 'Workshop', 'Break'] as const;

export default function ProgrammeSection({ event }: SectionProps) {
  const schedule: any[] = Array.isArray(event.programme_schedule) ? event.programme_schedule : [];
  const [filter, setFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!schedule.length) return null;

  const filtered = filter === 'All' ? schedule : schedule.filter(s => s.type?.toLowerCase() === filter.toLowerCase());
  const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <section id="programme" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Programme</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4 type-grow">
          {sectionLabel(event)}
        </h2>
        {eventDate && <p className="font-display text-xl text-black/50 italic mb-10">{eventDate}</p>}

        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-[10px] uppercase tracking-[0.15em] px-4 py-2 rounded-full border transition-colors ${filter === f ? 'bg-black text-white border-black' : 'border-black/10 text-black/50 hover:border-black/30'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((session, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} className="card-hover">
                <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full flex items-center gap-4 bg-black text-white px-6 py-4 rounded-lg text-left hover:bg-black/90 transition-colors">
                  <span className="font-display text-lg text-white/30 w-10 shrink-0">{ROMAN[i] || i + 1}</span>
                  {session.time && <span className="font-mono text-xs text-white/40 w-16 shrink-0">{session.time}</span>}
                  <span className="font-medium text-sm flex-1">{session.title || session.name}</span>
                  {session.type && <span className="text-[9px] uppercase tracking-wider text-white/30 px-2 py-0.5 border border-white/10 rounded">{session.type}</span>}
                  <span className="text-white/40 text-lg">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg px-6 py-5 space-y-3">
                    {session.description && <p className="text-sm text-black/70 leading-relaxed">{session.description}</p>}
                    {session.facilitator && <p className="text-xs text-black/50"><span className="font-medium text-black/70">Facilitator:</span> {session.facilitator}</p>}
                    {session.speakers?.length > 0 && <p className="text-xs text-black/50"><span className="font-medium text-black/70">Speakers:</span> {session.speakers.join(', ')}</p>}
                    {session.venue && <p className="text-xs text-black/50"><span className="font-medium text-black/70">Venue:</span> {session.venue}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && <p className="text-center text-sm text-black/40 py-12">No sessions match this filter.</p>}
      </div>
    </section>
  );
}

function sectionLabel(event: any) {
  const type = event.event_type;
  if (type === 'symposium') return 'Programme';
  if (type === 'conference') return 'Conference Programme';
  return 'Programme';
}
