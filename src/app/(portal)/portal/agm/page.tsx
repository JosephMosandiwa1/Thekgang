'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';

interface Agm { id: number; year: number; meeting_date: string | null; venue: string | null; status: string }

export default function PortalAgmList() {
  const [rows, setRows] = useState<Agm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('agm_events').select('*').order('year', { ascending: false });
      setRows((data || []) as Agm[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">AGM</p>
      <h1 className="font-display text-3xl font-bold mb-2">Annual General Meetings</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">Cast your vote on Council resolutions. As an Active Practitioner member, one vote per resolution.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((a) => (
          <Link key={a.id} href={`/portal/agm/${a.id}`} className="border border-gray-200 p-5 hover:border-black transition-colors">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{a.status}</p>
            <p className="font-display text-2xl font-bold">AGM {a.year}</p>
            {a.meeting_date && <p className="text-sm text-gray-500 mt-2">{formatDateTime(a.meeting_date)}</p>}
            {a.venue && <p className="text-xs text-gray-500 mt-1">{a.venue}</p>}
          </Link>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-500">No AGMs scheduled.</p>}
      </div>
    </div>
  );
}
