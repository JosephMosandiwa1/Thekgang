import Link from 'next/link';

/**
 * EventCalendar — month-grid view of public events.
 *
 * Server component. Receives the current month + the events that fall
 * within it and renders a 7-column weekday grid with up to 3 chips per
 * day. Past days are visually muted; today is highlighted.
 *
 * Navigation lives in the URL: `?month=YYYY-MM`. Caller passes the
 * resolved month + events; the component is pure rendering.
 */

export interface CalendarEvent {
  id: number;
  title: string;
  slug: string | null;
  event_date: string;     // ISO yyyy-mm-dd
  event_time: string | null;
  event_type: string | null;
  is_dedicated: boolean | null;
  status: string | null;
}

interface EventCalendarProps {
  month: Date;                    // first day of the visible month
  events: CalendarEvent[];        // all events whose event_date falls in month grid range
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EventCalendar({ month, events }: EventCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const monthLabel = month.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  // Week starts Monday (ISO).
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const cells: Array<Date | null> = Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return new Date(year, monthIndex, dayNumber);
  });

  // Index events by ISO date for O(1) day lookup.
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (!eventsByDate.has(e.event_date)) eventsByDate.set(e.event_date, []);
    eventsByDate.get(e.event_date)!.push(e);
  }

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = isoMonth(new Date(year, monthIndex - 1, 1));
  const nextMonth = isoMonth(new Date(year, monthIndex + 1, 1));
  const todayMonth = isoMonth(today);

  return (
    <div>
      {/* Header · month + prev/next/today */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold text-black">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`?month=${prevMonth}`}
            className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 hover:border-black rounded-sm"
            aria-label="Previous month"
          >
            ← Prev
          </Link>
          <Link
            href={`?month=${todayMonth}`}
            className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 hover:border-black rounded-sm"
          >
            Today
          </Link>
          <Link
            href={`?month=${nextMonth}`}
            className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 hover:border-black rounded-sm"
            aria-label="Next month"
          >
            Next →
          </Link>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-sm overflow-hidden">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="bg-gray-50 px-2 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-gray-500 font-semibold">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="bg-white aspect-square min-h-[88px]" />;
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(iso) ?? [];
          const isToday = iso === todayIso;
          const isPast = iso < todayIso;
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={iso}
              className={`bg-white p-2 min-h-[88px] flex flex-col gap-1 ${isPast ? 'bg-gray-50/40' : ''}`}
            >
              <div className={`flex items-center justify-between text-[11px] ${isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                <span className={isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--cdcc-gold,#C5A15A)] text-white font-bold' : 'font-semibold'}>
                  {date.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.slug || e.id}`}
                    className={`block text-[10px] truncate rounded-sm px-1.5 py-0.5 transition-colors ${
                      isPast
                        ? 'bg-gray-100 text-gray-500 hover:text-gray-700'
                        : 'bg-[var(--cdcc-gold,#C5A15A)]/15 text-[var(--cdcc-gold,#C5A15A)] hover:bg-[var(--cdcc-gold,#C5A15A)]/25'
                    }`}
                    title={e.title}
                  >
                    {e.event_time ? `${e.event_time.slice(0, 5)} · ` : ''}{e.title}
                  </Link>
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-gray-500 px-1">+{overflow} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
