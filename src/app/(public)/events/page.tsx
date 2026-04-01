'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Event { id: number; title: string; event_date: string; event_time: string; venue: string; venue_address: string; capacity: number; status: string; description: string }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('events').select('*').neq('status', 'draft').order('event_date');
    setEvents((data || []) as Event[]);
    setLoading(false);
  }

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Events</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>What&apos;s happening.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Imbizos, workshops, book launches — across 9 provinces. <Link href="/programmes" className="link-draw text-black inline-block">See our programmes &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? <p className="text-sm text-gray-500 text-center py-12">Loading...</p> : (
            <>
              {upcoming.length > 0 ? (
                <div className="mb-16">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6">Upcoming</p>
                  {upcoming.map(e => (
                    <Link key={e.id} href={`/events/${e.id}`} className="group block card-hover p-8 bg-white rounded mb-6 transition-all">
                      <p className="text-xs text-gray-500 mb-2">{new Date(e.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <h2 className="font-display text-2xl font-bold text-black type-card-title mb-2">{e.title}</h2>
                      {e.venue && <p className="text-sm text-gray-500">{e.venue}</p>}
                      {e.description && <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">{e.description}</p>}
                      <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 group-hover:text-black transition-colors mt-4 inline-block type-breathe">Register &rarr;</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 rounded p-12 text-center mb-16 bg-white">
                  <p className="text-gray-500 mb-2">No upcoming events right now.</p>
                  <Link href="/join" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Join the registry to be notified &rarr;</Link>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-6">Past Events</p>
                  {past.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
                      <div><p className="text-sm text-black type-breathe">{e.title}</p><p className="text-xs text-gray-500">{e.event_date}</p></div>
                      <span className="text-[10px] text-gray-500">Completed</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
