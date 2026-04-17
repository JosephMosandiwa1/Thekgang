'use client';

import type { SectionProps } from '../SectionRegistry';

export default function GalaProgrammeSection({ event }: SectionProps) {
  const schedule: any[] = Array.isArray(event.programme_schedule) ? event.programme_schedule : [];
  if (!schedule.length) return null;

  return (
    <section id="gala_programme" className="py-24 md:py-32 px-6 bg-black text-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">The Evening</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-16 type-grow">Order of Proceedings</h2>

        <div className="relative">
          <div className="absolute left-[60px] top-0 bottom-0 w-[1px] bg-white/10" />

          <div className="space-y-8">
            {schedule.map((item, i) => (
              <div key={i} className="flex items-start gap-6 relative">
                <div className="w-[60px] shrink-0 text-right">
                  <span className="font-mono text-sm text-white/40">{item.time || ''}</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-white/20 border-2 border-black shrink-0 mt-1 relative z-10" />
                <div className="flex-1 pb-2">
                  <h3 className="font-display text-lg font-semibold">{item.title || item.name}</h3>
                  {item.description && <p className="text-sm text-white/50 mt-1">{item.description}</p>}
                  {item.presenter && <p className="text-xs text-white/30 mt-1">{item.presenter}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
