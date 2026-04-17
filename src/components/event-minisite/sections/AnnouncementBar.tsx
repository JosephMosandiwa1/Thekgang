'use client';

import type { SectionProps } from '../SectionRegistry';

export default function AnnouncementBar({ event }: SectionProps) {
  const announcements: any[] = Array.isArray(event.announcements) ? event.announcements : [];
  if (!announcements.length) return null;

  return (
    <section id="announcement_bar" className="px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {announcements.map((a, i) => {
          const level = a.level || a.type || 'info';
          const bg = level === 'urgent' ? 'bg-red-50 border-red-200 text-red-800'
            : level === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-blue-50 border-blue-200 text-blue-800';

          return (
            <div key={i} className={`rounded-lg border px-5 py-3 text-sm ${bg}`}>
              {a.title && <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">{a.title}</p>}
              <p>{a.message || a.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
