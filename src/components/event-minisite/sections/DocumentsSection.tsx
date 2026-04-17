'use client';

import type { SectionProps } from '../SectionRegistry';

const TYPE_ICONS: Record<string, string> = {
  pdf: '\u{1F4C4}', doc: '\u{1F4DD}', docx: '\u{1F4DD}', xls: '\u{1F4CA}', xlsx: '\u{1F4CA}',
  ppt: '\u{1F4CA}', pptx: '\u{1F4CA}', image: '\u{1F5BC}', video: '\u{1F3AC}', default: '\u{1F4CE}',
};

function getIcon(type?: string) {
  if (!type) return TYPE_ICONS.default;
  return TYPE_ICONS[type.toLowerCase()] || TYPE_ICONS.default;
}

export default function DocumentsSection({ event }: SectionProps) {
  const docs: { name: string; url: string; type?: string }[] = Array.isArray(event.documents) ? event.documents : [];
  if (!docs.length) return null;

  return (
    <section id="documents" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Documents</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Documents & Resources</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {docs.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noopener" className="bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4 card-hover group">
              <span className="text-2xl">{getIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{doc.name}</p>
                {doc.type && <p className="text-[10px] uppercase tracking-wider text-black/30 mt-1">{doc.type}</p>}
              </div>
              <span className="btn-ink text-[10px] uppercase tracking-wider px-3 py-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
