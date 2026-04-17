'use client';

import type { SectionProps } from '../SectionRegistry';

export default function PastWinnersSection({ event }: SectionProps) {
  const winners: any[] = Array.isArray(event.winners) ? event.winners : [];
  if (!winners.length) return null;

  const byYear = winners.reduce((acc, w) => {
    const year = w.year || 'Previous';
    if (!acc[year]) acc[year] = [];
    acc[year].push(w);
    return acc;
  }, {} as Record<string, any[]>);

  const years = Object.keys(byYear).sort((a, b) => (b === 'Previous' ? -1 : Number(b) - Number(a)));

  return (
    <section id="past_winners" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Archive</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Past Winners</h2>

        <div className="space-y-10">
          {years.map(year => (
            <div key={year}>
              <h3 className="font-display text-2xl font-bold text-black mb-4">{year}</h3>
              <div className="space-y-2">
                {byYear[year].map((w: any, i: number) => (
                  <div key={i} className="flex items-baseline gap-4 py-2 border-b border-gray-200 last:border-0">
                    <span className="text-xs text-black/30 uppercase tracking-wider w-40 shrink-0">{w.category}</span>
                    <span className="text-sm font-medium text-black">{w.winner_name}</span>
                    {w.work_title && <span className="text-sm italic text-black/50">{w.work_title}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
