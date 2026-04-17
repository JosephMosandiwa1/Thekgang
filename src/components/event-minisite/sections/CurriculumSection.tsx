'use client';

import type { SectionProps } from '../SectionRegistry';

export default function CurriculumSection({ event }: SectionProps) {
  const modules: any[] = Array.isArray(event.curriculum) ? event.curriculum : [];
  if (!modules.length) return null;

  return (
    <section id="curriculum" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Curriculum</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Curriculum</h2>

        <div className="space-y-6">
          {modules.map((mod, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-6 card-hover">
              <div className="flex items-start gap-4">
                <span className="font-display text-2xl text-black/20 w-12 shrink-0">{mod.day || `Day ${i + 1}`}</span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold text-black">{mod.title}</h3>
                  {mod.trainer && <p className="text-sm text-black/50 mt-1">Trainer: {mod.trainer}</p>}
                  {mod.description && <p className="text-sm text-black/70 leading-relaxed mt-3">{mod.description}</p>}
                  {Array.isArray(mod.learning_outcomes) && mod.learning_outcomes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-2">Learning Outcomes</p>
                      <ul className="space-y-1">
                        {mod.learning_outcomes.map((o: string, j: number) => (
                          <li key={j} className="text-sm text-black/60 flex items-start gap-2">
                            <span className="text-black/20 mt-0.5">&#10003;</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
