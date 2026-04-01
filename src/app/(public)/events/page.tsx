'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Event { id: number; title: string; event_date: string; event_time: string; venue: string; venue_address: string; capacity: number; status: string; description: string; cover_image_url: string }

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
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold mb-3">Events</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">What&apos;s happening.</h1>
        <p className="text-sm text-gray-500 max-w-xl mb-12">Imbizos, workshops, book launches, and activations — across 9 provinces. Come as you are.</p>

        {loading ? <p className="text-sm text-gray-500/50 text-center py-12">Loading...</p> : (
          <>
            {upcoming.length > 0 && (
              <div className="mb-16">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-6">Upcoming</h2>
                <div className="space-y-6">
                  {upcoming.map(e => (
                    <Link key={e.id} href={`/events/${e.id}`} className="block group border border-gray-200/50 p-8 hover:border-gray-300 hover:shadow-lg transition-all bg-white rounded">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-black font-medium mb-1">{new Date(e.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{e.event_time ? ` at ${e.event_time.slice(0, 5)}` : ''}</p>
                          <h3 className="font-display text-xl font-bold text-black group-hover:text-black transition-colors">{e.title}</h3>
                          {e.venue && <p className="text-sm text-gray-500 mt-2">{e.venue}{e.venue_address ? `, ${e.venue_address}` : ''}</p>}
                          {e.description && <p className="text-sm text-gray-500/70 mt-3 leading-relaxed line-clamp-2">{e.description}</p>}
                        </div>
                        {e.capacity && <span className="text-[10px] text-gray-500/50 flex-shrink-0">{e.capacity} seats</span>}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-black mt-4">Register &rarr;</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && (
              <div className="border border-gray-200/50 rounded p-12 text-center mb-16 bg-white">
                <p className="text-gray-500">No upcoming events right now.</p>
                <p className="text-xs text-gray-500/50 mt-2">Subscribe to our newsletter to be first to know.</p>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-6">Past Events</h2>
                <div className="space-y-3">
                  {past.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0">
                      <div>
                        <p className="text-sm text-black">{e.title}</p>
                        <p className="text-xs text-gray-500">{e.event_date} &middot; {e.venue || 'TBC'}</p>
                      </div>
                      <span className="text-[10px] text-gray-500/40">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
