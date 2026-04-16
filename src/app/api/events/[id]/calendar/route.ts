import { getSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function pad(n: number) { return String(n).padStart(2, '0'); }
function toICSDate(iso: string, time?: string): string {
  const d = new Date(iso);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  }
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = getSupabase();
  if (!sb) return new Response('Not configured', { status: 503 });

  const { data: event } = await sb.from('events').select('*').eq('id', parseInt(id) || 0).single();
  if (!event) return new Response('Event not found', { status: 404 });

  const dtStart = toICSDate(event.event_date, event.event_time);
  const dtEnd = event.end_date
    ? toICSDate(event.end_date, '17:00')
    : toICSDate(event.event_date, event.event_time ? `${parseInt(event.event_time) + 3}:00` : '17:00');

  const location = [event.venue, event.venue_address].filter(Boolean).join(', ');
  const description = (event.description || '').replace(/<[^>]*>/g, '').slice(0, 500);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CDCC Thekgang//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    `DESCRIPTION:${escapeICS(description)}`,
    `UID:cdcc-event-${event.id}@thekgang.org.za`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug || event.id}.ics"`,
    },
  });
}
