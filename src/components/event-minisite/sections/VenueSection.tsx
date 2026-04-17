'use client';

import type { SectionProps } from '../SectionRegistry';

export default function VenueSection({ event }: SectionProps) {
  const hasContent = event.venue || event.venue_address || event.venue_map_embed || event.venue_map_url || event.transport_info || event.accommodation_info;
  if (!hasContent) return null;

  return (
    <section id="venue" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Venue</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Venue & Logistics</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {event.venue && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-2">Venue</p>
                <p className="font-display text-xl font-semibold text-black">{event.venue}</p>
                {event.venue_address && <p className="text-sm text-black/60 mt-1">{event.venue_address}</p>}
              </div>
            )}
            {event.transport_info && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-2">Getting There</p>
                <p className="text-sm text-black/70 leading-relaxed whitespace-pre-line">{event.transport_info}</p>
              </div>
            )}
            {event.accommodation_info && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 card-hover">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-2">Accommodation</p>
                <p className="text-sm text-black/70 leading-relaxed whitespace-pre-line">{event.accommodation_info}</p>
              </div>
            )}
          </div>

          <div>
            {event.venue_map_embed ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 aspect-square">
                <iframe src={event.venue_map_embed} className="w-full h-full border-0" loading="lazy" allowFullScreen title="Venue map" />
              </div>
            ) : event.venue_map_url ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 aspect-square">
                <img src={event.venue_map_url} alt="Venue map" className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
