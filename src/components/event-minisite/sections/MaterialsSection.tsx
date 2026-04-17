'use client';

import type { SectionProps } from '../SectionRegistry';

const MATERIAL_TYPES = ['pre-reading', 'handout', 'worksheet', 'template', 'material', 'slides'];

export default function MaterialsSection({ event }: SectionProps) {
  const docs: any[] = Array.isArray(event.documents) ? event.documents : [];
  const materials = docs.filter(d => MATERIAL_TYPES.includes(d.type?.toLowerCase()));
  if (!materials.length) return null;

  return (
    <section id="materials" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Materials</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Course Materials</h2>

        <div className="space-y-3">
          {materials.map((mat, i) => (
            <a key={i} href={mat.url} target="_blank" rel="noopener"
              className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-5 card-hover group">
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                <span className="text-[10px] uppercase font-mono text-black/40">{mat.type || 'DOC'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{mat.name}</p>
                {mat.type && <p className="text-[10px] uppercase tracking-wider text-black/30 mt-0.5">{mat.type}</p>}
              </div>
              <span className="btn-ink text-[10px] uppercase tracking-wider px-3 py-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
