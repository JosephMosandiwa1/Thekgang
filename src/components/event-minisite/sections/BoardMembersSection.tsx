'use client';

import type { SectionProps } from '../SectionRegistry';

export default function BoardMembersSection({ event }: SectionProps) {
  const members: any[] = Array.isArray(event.speakers) ? event.speakers : [];
  if (!members.length) return null;

  return (
    <section id="board_members" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Board</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Board Members</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {members.map((m, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 card-hover text-center">
              {m.photo_url ? (
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3">
                  <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover img-mono" />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <span className="font-display text-2xl text-black/10">{(m.name || '?')[0]}</span>
                </div>
              )}
              <h3 className="font-display text-base font-semibold text-black">{m.name}</h3>
              {m.title && <p className="text-sm text-black/50 mt-0.5">{m.title}</p>}
              {(m.term_start || m.term_end) && (
                <p className="text-xs text-black/30 mt-1">{m.term_start || ''} &ndash; {m.term_end || 'Present'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
