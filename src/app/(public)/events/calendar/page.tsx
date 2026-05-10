import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import { EventCalendar, type CalendarEvent } from '@/components/calendar/EventCalendar';
import { EventAgenda } from '@/components/calendar/EventAgenda';
import { PageZone } from '@/components/placements/PageZone';

/**
 * /events/calendar — month-grid view of public events.
 *
 * Default mode = grid (desktop · large screens), with an inline agenda
 * fallback for mobile via responsive CSS. Navigation lives in the URL
 * (`?month=YYYY-MM`) so links + share work natively.
 */

export const revalidate = 60;

interface Props {
  searchParams: { month?: string };
}

export default async function EventsCalendarPage({ searchParams }: Props) {
  const monthParam = searchParams.month;
  const month = parseMonth(monthParam) ?? firstOfThisMonth();

  const events = await loadEventsForMonthGrid(month);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Events</p>
            <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Calendar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/events" className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black px-3 py-1.5">List</Link>
            <span className="text-xs uppercase tracking-[0.15em] bg-black text-white px-3 py-1.5 rounded-sm">Calendar</span>
          </div>
        </div>

        <PageZone page="/events" position="head" />

        {/* Grid for tablet+, agenda for phone */}
        <div className="hidden md:block">
          <EventCalendar month={month} events={events} />
        </div>
        <div className="md:hidden">
          <EventAgenda events={events} emptyLabel="No events scheduled this month." />
        </div>

        <div className="mt-10">
          <PageZone page="/events" position="footer" />
        </div>
      </div>
    </div>
  );
}

function parseMonth(s: string | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  return new Date(year, month, 1);
}

function firstOfThisMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function loadEventsForMonthGrid(month: Date): Promise<CalendarEvent[]> {
  const sb = getSupabase();
  if (!sb) return [];

  // Fetch a range covering the visible month grid (some leading + trailing
  // days from neighbouring months). Padding by 7 days each side is enough
  // for a 6-row grid at any first-day-of-week.
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - 7);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setDate(end.getDate() + 7);

  const { data, error } = await sb
    .from('events')
    .select('id, title, slug, event_date, event_time, event_type, is_dedicated, status')
    .neq('status', 'draft')
    .gte('event_date', isoDay(start))
    .lte('event_date', isoDay(end))
    .order('event_date');

  if (error || !data) return [];
  return data as CalendarEvent[];
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
