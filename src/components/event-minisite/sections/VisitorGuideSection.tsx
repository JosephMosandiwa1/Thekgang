'use client';

import type { SectionProps } from '../SectionRegistry';

export default function VisitorGuideSection({ event }: SectionProps) {
  const hasContent = event.event_time || event.venue || event.transport_info || event.target_audience || event.dress_code;
  if (!hasContent) return null;

  const cards = [
    { label: 'Date & Time', value: event.event_date ? `${new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}` : null },
    { label: 'Venue', value: event.venue ? `${event.venue}${event.venue_address ? `, ${event.venue_address}` : ''}` : null },
    { label: 'Getting There', value: event.transport_info },
    { label: 'Who Should Attend', value: event.target_audience },
    { label: 'Dress Code', value: event.dress_code },
  ].filter(c => c.value);

  return (
    <section id="visitor_guide" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Visitor Guide</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Practical Information</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-2">{card.label}</p>
              <p className="text-sm text-black/70 leading-relaxed whitespace-pre-line">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
