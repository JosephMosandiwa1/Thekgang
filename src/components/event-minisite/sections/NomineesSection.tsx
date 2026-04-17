'use client';

import type { SectionProps } from '../SectionRegistry';

export default function NomineesSection({ event }: SectionProps) {
  const nominees: any[] = Array.isArray(event.nominees) ? event.nominees : [];
  if (!nominees.length) return null;

  const grouped = nominees.reduce((acc, n) => {
    const cat = n.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(n);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <section id="nominees" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Nominees</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Nominees</h2>

        <div className="space-y-12">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="font-display text-xl font-semibold text-black mb-6">{cat}</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(items as any[]).map((n, i) => (
                  <div key={i} className={`bg-white rounded-lg border p-5 card-hover relative ${n.is_winner ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}>
                    {n.is_winner && (
                      <span className="absolute -top-2.5 right-4 bg-black text-white text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">Winner</span>
                    )}
                    <div className="flex items-start gap-3">
                      {n.photo_url && <img src={n.photo_url} alt={n.name} className="w-14 h-14 rounded-full object-cover img-mono shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-black">{n.name}</h4>
                        {n.work_title && <p className="text-sm italic text-black/50 mt-0.5">{n.work_title}</p>}
                        {n.publisher && <p className="text-xs text-black/30 mt-0.5">{n.publisher}</p>}
                      </div>
                    </div>
                    {n.citation && <p className="text-xs text-black/60 leading-relaxed mt-3">{n.citation}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
