'use client';

import type { SectionProps } from '../SectionRegistry';

export default function DiscussionTopicsSection({ event }: SectionProps) {
  const topics: any[] = Array.isArray(event.discussion_topics) ? event.discussion_topics : [];
  if (!topics.length) return null;

  return (
    <section id="discussion_topics" className="py-24 md:py-32 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">The Discussion</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-16 type-grow">Questions We Will Explore</h2>

        <div className="space-y-8">
          {topics.map((topic, i) => (
            <div key={i} className="border-l-2 border-white/20 pl-8 py-4 card-hover">
              <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight leading-tight">{topic.question}</h3>
              {topic.description && <p className="text-sm text-white/50 leading-relaxed mt-3">{topic.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
