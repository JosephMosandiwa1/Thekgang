'use client';

import type { SectionProps } from '../SectionRegistry';

export default function JudgingPanelSection({ event }: SectionProps) {
  const speakers: any[] = Array.isArray(event.speakers) ? event.speakers : [];
  const judges = speakers.filter(s => s.type === 'judge');
  if (!judges.length) return null;

  return (
    <section id="judging_panel" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Judging Panel</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">The Judges</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {judges.map((j, i) => (
            <div key={i} className="card-hover text-center">
              {j.photo_url ? (
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4">
                  <img src={j.photo_url} alt={j.name} className="w-full h-full object-cover img-mono" />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <span className="font-display text-3xl text-black/10">{(j.name || '?')[0]}</span>
                </div>
              )}
              <h3 className="font-display text-lg font-semibold text-black">{j.name}</h3>
              {j.title && <p className="text-sm text-black/50 mt-1">{j.title}</p>}
              {j.organisation && <p className="text-xs text-black/40">{j.organisation}</p>}
              {j.bio && <p className="text-sm text-black/60 leading-relaxed mt-3">{j.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
