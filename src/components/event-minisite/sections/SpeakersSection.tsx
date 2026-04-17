'use client';

import type { SectionProps } from '../SectionRegistry';

export default function SpeakersSection({ event }: SectionProps) {
  const speakers: any[] = Array.isArray(event.speakers) ? event.speakers : [];
  if (!speakers.length) return null;

  return (
    <section id="speakers" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Speakers</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-16 type-grow">The Speakers</h2>

        <div className="space-y-20">
          {speakers.map((s, i) => {
            const isEven = i % 2 === 1;
            return (
              <div key={i} className={`flex flex-col md:flex-row items-start gap-10 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                {s.photo_url ? (
                  <div className="w-[250px] h-[250px] shrink-0 overflow-hidden rounded-lg">
                    <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover img-mono" />
                  </div>
                ) : (
                  <div className="w-[250px] h-[250px] shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="font-display text-5xl text-black/10">{(s.name || '?')[0]}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-display text-[28px] font-semibold text-black tracking-tight">{s.name}</h3>
                  {s.title && <p className="text-sm text-black/50 mt-1">{s.title}</p>}
                  {s.organisation && <p className="text-sm text-black/40">{s.organisation}</p>}
                  {s.session && (
                    <span className="inline-block mt-3 text-[9px] uppercase tracking-[0.15em] px-3 py-1 border border-black/10 text-black/40 rounded-full">
                      {s.session}
                    </span>
                  )}
                  {s.bio && <p className="text-sm text-black/70 leading-[1.8] mt-4">{s.bio}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
