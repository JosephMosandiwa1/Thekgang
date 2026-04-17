import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and past events from the Books and Publishing Content Developers and Creators Council.',
};

export const revalidate = 30; // Events change frequently

interface Event { id: number; title: string; slug: string; event_date: string; event_time: string; venue: string; description: string; status: string; event_type: string; format: string; is_dedicated: boolean; recording_url: string; capacity: number }

export default async function EventsPage() {
  const sb = getSupabase();
  let events: Event[] = [];
  if (sb) {
    const { data } = await sb.from('events').select('*').neq('status', 'draft').order('event_date', { ascending: true });
    events = (data || []) as Event[];
  }

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.event_date >= now);
  const past = events.filter(e => e.event_date < now);

  function eventLink(e: Event) {
    return e.is_dedicated && e.slug ? `/events/${e.slug}` : `/events/${e.id}`;
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/icon-char-gld.svg" alt="" width={16} height={16} className="w-4 h-4 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60">Events</p>
          </div>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>What&apos;s happening.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Symposiums, workshops, imbizos — across 9 provinces. <Link href="/programmes" className="link-draw text-black inline-block">See our programmes &rarr;</Link></p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Upcoming */}
          {upcoming.length > 0 ? (
            <div className="mb-16">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-6">Upcoming</p>
              {upcoming.map(e => (
                <Link key={e.id} href={eventLink(e)} className="group block card-hover p-8 bg-white rounded mb-4 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-black/20 text-gray-500/60 rounded">{e.event_type || 'event'}</span>
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 text-gray-500 rounded">{e.format || 'in-person'}</span>
                    {e.is_dedicated && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-600 rounded">Dedicated Page</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{new Date(e.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{e.event_time ? ` at ${e.event_time.slice(0, 5)}` : ''}</p>
                  <h2 className="font-display text-2xl font-bold text-black mb-2">{e.title}</h2>
                  {e.venue && <p className="text-sm text-gray-500">{e.venue}</p>}
                  {e.description && <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">{e.description}</p>}
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-500 transition-colors mt-4 inline-block">
                    {e.is_dedicated ? 'View Event Page' : 'Register'} &rarr;
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 rounded p-12 text-center mb-16 bg-white">
              <p className="text-gray-500 mb-2">No upcoming events right now.</p>
              <Link href="/join" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Join the council to be notified &rarr;</Link>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-6">Past Events</p>
              {past.map(e => (
                <div key={e.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                  <div>
                    <Link href={eventLink(e)} className="text-sm text-black hover:underline font-medium">{e.title}</Link>
                    <p className="text-xs text-gray-500">{e.event_date} &middot; {e.venue || 'Virtual'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.recording_url && <a href={e.recording_url} target="_blank" rel="noopener" className="text-[9px] uppercase tracking-wider px-2 py-1 border border-black/30 text-gray-500 rounded hover:bg-black/5 transition-colors">Watch &rarr;</a>}
                    <span className="text-[10px] text-gray-400">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
