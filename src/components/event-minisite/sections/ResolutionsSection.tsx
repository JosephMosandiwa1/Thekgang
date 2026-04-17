'use client';

import type { SectionProps } from '../SectionRegistry';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  deferred: 'bg-gray-100 text-gray-600',
};

export default function ResolutionsSection({ event }: SectionProps) {
  const resolutions: any[] = Array.isArray(event.resolutions) ? event.resolutions : [];
  if (!resolutions.length) return null;

  return (
    <section id="resolutions" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Resolutions</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Resolutions</h2>

        <div className="space-y-4">
          {resolutions.map((r, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-5 card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="font-display text-lg font-bold text-black/20 shrink-0">{r.number || i + 1}.</span>
                  <p className="text-sm text-black/80 leading-relaxed">{r.text}</p>
                </div>
                {r.status && (
                  <span className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[r.status.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                )}
              </div>
              {r.assigned_to && <p className="text-xs text-black/40 mt-2 ml-7">Assigned to: {r.assigned_to}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
