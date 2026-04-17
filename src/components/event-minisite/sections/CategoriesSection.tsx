'use client';

import type { SectionProps } from '../SectionRegistry';

export default function CategoriesSection({ event }: SectionProps) {
  const categories: any[] = Array.isArray(event.award_categories) ? event.award_categories : [];
  if (!categories.length) return null;

  return (
    <section id="categories" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Categories</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Award Categories</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-6 card-hover">
              <h3 className="font-display text-lg font-semibold text-black">{cat.name}</h3>
              {cat.description && <p className="text-sm text-black/70 leading-relaxed mt-3">{cat.description}</p>}
              {cat.eligibility && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">Eligibility</p>
                  <p className="text-xs text-black/50">{cat.eligibility}</p>
                </div>
              )}
              {cat.past_winner && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">Past Winner</p>
                  <p className="text-xs text-black/60 font-medium">{cat.past_winner}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
