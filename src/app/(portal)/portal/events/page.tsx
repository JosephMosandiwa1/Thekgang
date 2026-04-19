'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRelative } from '@/lib/utils';

interface Registration {
  id: number;
  event_id: number;
  created_at: string;
  waitlisted: boolean;
  checked_in_at: string | null;
  events: {
    id: number;
    title: string;
    event_date: string;
    venue: string | null;
    slug: string | null;
    status: string;
  };
}

export default function PortalEvents() {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('event_registrations')
        .select('id, event_id, created_at, waitlisted, checked_in_at, events(id, title, event_date, venue, slug, status)')
        .eq('email', user.email ?? '')
        .order('created_at', { ascending: false });
      setRegs(((data || []) as unknown) as Registration[]);
      setLoading(false);
    })();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = regs.filter((r) => r.events && r.events.event_date >= today);
  const past = regs.filter((r) => r.events && r.events.event_date < today);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Your events</p>
          <h1 className="font-display text-3xl font-bold">Events</h1>
        </div>
        <Link href="/events" className="text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
          Browse all events →
        </Link>
      </div>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`pb-3 text-sm border-b-2 transition-colors ${tab === 'upcoming' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-500 hover:text-black'}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`pb-3 text-sm border-b-2 transition-colors ${tab === 'past' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-500 hover:text-black'}`}
        >
          Past ({past.length})
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading your events…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-500">
          {tab === 'upcoming' ? 'No upcoming registrations.' : 'No past events yet.'}{' '}
          <Link href="/events" className="underline">Browse events →</Link>
        </p>
      ) : (
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {list.map((r) => (
            <div key={r.id} className="py-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-gray-500">
                    {formatDate(r.events.event_date, 'short')} · {formatRelative(r.events.event_date)}
                  </p>
                  {r.waitlisted && <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5">Waitlisted</span>}
                  {r.checked_in_at && <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5">Attended</span>}
                </div>
                <p className="font-medium">{r.events.title}</p>
                {r.events.venue && <p className="text-xs text-gray-500 mt-1">{r.events.venue}</p>}
              </div>
              <Link
                href={`/events/${r.events.slug || r.events.id}`}
                className="text-xs text-gray-500 hover:text-black transition-colors shrink-0"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
