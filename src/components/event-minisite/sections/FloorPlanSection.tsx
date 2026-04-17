'use client';

import type { SectionProps } from '../SectionRegistry';

export default function FloorPlanSection({ event }: SectionProps) {
  if (!event.venue_map_url) return null;

  return (
    <section id="floor_plan" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Floor Plan</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Floor Plan</h2>

        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
          <img src={event.venue_map_url} alt="Floor plan" className="w-full object-contain" />
        </div>
      </div>
    </section>
  );
}
