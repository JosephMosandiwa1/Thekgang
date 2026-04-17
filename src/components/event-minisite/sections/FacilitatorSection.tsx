'use client';

import type { SectionProps } from '../SectionRegistry';

export default function FacilitatorSection({ event }: SectionProps) {
  const speakers: any[] = Array.isArray(event.speakers) ? event.speakers : [];
  const facilitator = speakers.find(s => s.type === 'facilitator') || speakers[0];
  if (!facilitator) return null;

  return (
    <section id="facilitator" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Facilitator</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Your Facilitator</h2>

        <div className="flex flex-col md:flex-row items-start gap-10">
          {facilitator.photo_url ? (
            <div className="w-[300px] h-[300px] shrink-0 overflow-hidden rounded-lg">
              <img src={facilitator.photo_url} alt={facilitator.name} className="w-full h-full object-cover img-mono" />
            </div>
          ) : (
            <div className="w-[300px] h-[300px] shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="font-display text-7xl text-black/10">{(facilitator.name || '?')[0]}</span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-display text-3xl font-bold text-black tracking-tight">{facilitator.name}</h3>
            {facilitator.title && <p className="text-base text-black/50 mt-1">{facilitator.title}</p>}
            {facilitator.organisation && <p className="text-sm text-black/40">{facilitator.organisation}</p>}
            {facilitator.bio && <p className="text-base text-black/70 leading-[1.9] mt-5">{facilitator.bio}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
