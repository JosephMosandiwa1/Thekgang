'use client';

import type { SectionProps } from '../SectionRegistry';

export default function AgendaSection({ event }: SectionProps) {
  const items: any[] = Array.isArray(event.agenda_items) ? event.agenda_items : [];
  if (!items.length) return null;

  return (
    <section id="agenda" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Agenda</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Agenda</h2>

        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-6 py-4 border-b border-gray-100 last:border-0">
              <span className="font-display text-lg font-bold text-black/20 w-10 shrink-0 text-right">
                {item.number || i + 1}.
              </span>
              <div className="flex-1">
                <h3 className="text-base font-medium text-black">{item.title}</h3>
                {item.presenter && <p className="text-sm text-black/50 mt-0.5">Presenter: {item.presenter}</p>}
                {item.notes && <p className="text-sm text-black/60 leading-relaxed mt-2">{item.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
