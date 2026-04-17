'use client';

import type { SectionProps } from '../SectionRegistry';

export default function AboutSection({ event }: SectionProps) {
  const themes = Array.isArray(event.key_themes) ? event.key_themes : [];

  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">About</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-8 type-grow">
          About {event.event_type === 'symposium' ? 'the Symposium' : event.event_type === 'book_fair' ? 'the Fair' : 'this Event'}
        </h2>

        {event.description && (
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black/70 prose-p:leading-[1.8] prose-blockquote:border-l-2 prose-blockquote:border-black prose-blockquote:italic prose-blockquote:text-black/50 prose-img:rounded-lg text-[17px] leading-[1.8]"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        )}

        {event.why_attend && (
          <div className="mt-12 p-8 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-3">Why Attend</p>
            <p className="text-sm text-black/70 leading-[1.8]">{event.why_attend}</p>
          </div>
        )}

        {themes.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {themes.map((t: string, i: number) => (
              <span key={i} className="text-[10px] uppercase tracking-[0.15em] px-4 py-2 border border-black/10 text-black/50 rounded-full hover:border-black/30 hover:text-black transition-colors">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
