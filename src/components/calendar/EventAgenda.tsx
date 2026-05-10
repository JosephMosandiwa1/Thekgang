import Link from 'next/link';
import type { CalendarEvent } from './EventCalendar';

/**
 * EventAgenda — list view of public events grouped by week.
 *
 * Sibling to EventCalendar — same data, different shape. Mobile-default
 * via the responsive wrapper on the route page.
 */
interface EventAgendaProps {
  events: CalendarEvent[];
  emptyLabel?: string;
}

export function EventAgenda({ events, emptyLabel = 'No events in this view.' }: EventAgendaProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">{emptyLabel}</p>;
  }

  // Group by week-of-year
  const byWeek = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const d = new Date(e.event_date + 'T00:00:00');
    const week = weekKey(d);
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week)!.push(e);
  }

  const today = new Date();
  const todayIso = isoDay(today);

  return (
    <div className="space-y-6">
      {Array.from(byWeek.entries()).map(([weekLabel, weekEvents]) => (
        <section key={weekLabel}>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-gray-500/70 font-semibold mb-2 border-b border-gray-200 pb-1">
            {weekLabel}
          </h3>
          <ul className="divide-y divide-gray-100">
            {weekEvents.map((e) => {
              const isPast = e.event_date < todayIso;
              const dateLabel = new Date(e.event_date + 'T00:00:00').toLocaleDateString('en-ZA', {
                weekday: 'short', day: 'numeric', month: 'short',
              });
              return (
                <li key={e.id} className={`flex items-baseline gap-4 py-3 ${isPast ? 'opacity-60' : ''}`}>
                  <div className="w-28 flex-shrink-0">
                    <p className="text-xs font-mono text-gray-500">{dateLabel}</p>
                    {e.event_time && <p className="text-[10px] text-gray-400">{e.event_time.slice(0, 5)}</p>}
                  </div>
                  <div className="flex-1">
                    <Link href={`/events/${e.slug || e.id}`} className="text-sm font-medium text-black hover:underline">
                      {e.title}
                    </Link>
                    {e.event_type && (
                      <p className="text-[10px] uppercase tracking-wider text-gray-500/70 mt-0.5">{e.event_type.replace(/_/g, ' ')}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function weekKey(d: Date): string {
  const monday = new Date(d);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
