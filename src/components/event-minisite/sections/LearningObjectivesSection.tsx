'use client';

import type { SectionProps } from '../SectionRegistry';

export default function LearningObjectivesSection({ event }: SectionProps) {
  const objectives: string[] = Array.isArray(event.learning_objectives) ? event.learning_objectives : [];
  if (!objectives.length) return null;

  return (
    <section id="learning_objectives" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Outcomes</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">What You Will Learn</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {objectives.map((obj, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 card-hover flex items-start gap-4">
              <span className="font-display text-2xl font-bold text-black/10">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-sm text-black/70 leading-relaxed flex-1">{obj}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
