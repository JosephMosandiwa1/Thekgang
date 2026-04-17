'use client';

import type { SectionProps } from '../SectionRegistry';

export default function PressKitSection({ event }: SectionProps) {
  const docs: any[] = Array.isArray(event.documents) ? event.documents : [];
  const pressDocs = docs.filter(d => d.type === 'press');
  const hasContent = event.press_kit_url || pressDocs.length > 0;
  if (!hasContent) return null;

  return (
    <section id="press_kit" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Press</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Press Kit</h2>

        <div className="space-y-4">
          {event.press_kit_url && (
            <a href={event.press_kit_url} target="_blank" rel="noopener" className="flex items-center gap-4 bg-gray-50 rounded-lg border border-gray-200 p-5 card-hover group">
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">ZIP</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-black">Download Full Press Kit</p>
                <p className="text-[10px] text-black/40 mt-0.5">Logos, images, press release</p>
              </div>
              <span className="btn-ink text-[10px] uppercase tracking-wider px-3 py-1.5">Download</span>
            </a>
          )}

          {pressDocs.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener" className="flex items-center gap-4 bg-gray-50 rounded-lg border border-gray-200 p-5 card-hover group">
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0">
                <span className="text-[10px] uppercase font-mono text-black/40">{doc.type}</span>
              </div>
              <p className="text-sm font-medium text-black flex-1">{doc.name}</p>
              <span className="btn-ink text-[10px] uppercase tracking-wider px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
