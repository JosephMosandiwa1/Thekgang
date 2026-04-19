'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand } from '@/lib/utils';

interface Opp {
  id: number;
  slug: string | null;
  title: string;
  issuer: string | null;
  description: string | null;
  amount_rands: number | null;
  total_pool_rands: number | null;
  discipline_tags: string[];
  closes_at: string | null;
  status: string;
  guidelines_url: string | null;
}

export default function PublicGrantsPage() {
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from('grant_opportunities')
        .select('*')
        .in('status', ['open', 'closing', 'awarded'])
        .order('closes_at', { ascending: true, nullsFirst: false });
      setOpps(((data || []) as unknown) as Opp[]);
      setLoading(false);
    })();
  }, []);

  const open = opps.filter((o) => o.status === 'open' || o.status === 'closing');
  const awarded = opps.filter((o) => o.status === 'awarded');

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Funding</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-6" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          Grants &amp; bursaries
        </h1>
        <p className="text-gray-600 mb-12 max-w-2xl">
          Funding opportunities for practitioners across the 14 publishing disciplines — from the Council, DSAC, NAC, and affiliated funders.
        </p>

        <section className="mb-16">
          <h2 className="font-display text-xl font-bold mb-6">Open now</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : open.length === 0 ? (
            <p className="text-sm text-gray-500">No open opportunities at the moment. <Link href="/join" className="underline">Join the Council</Link> to be notified as new calls open.</p>
          ) : (
            <div className="space-y-4">
              {open.map((o) => (
                <div key={o.id} className="border border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{o.issuer || 'Council'}</p>
                      <h3 className="font-display text-xl font-bold mb-2">{o.title}</h3>
                      {o.description && <p className="text-sm text-gray-700 mb-3">{o.description}</p>}
                      <dl className="text-xs space-y-0.5">
                        {o.amount_rands && <div><dt className="inline text-gray-500">Per award: </dt><dd className="inline font-medium">{formatRand(o.amount_rands)}</dd></div>}
                        {o.total_pool_rands && <div><dt className="inline text-gray-500">Total pool: </dt><dd className="inline">{formatRand(o.total_pool_rands)}</dd></div>}
                        {o.closes_at && <div><dt className="inline text-gray-500">Closes: </dt><dd className="inline">{formatDate(o.closes_at, 'long')}</dd></div>}
                      </dl>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Link href="/portal/grants" className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2 hover:bg-gray-800">
                        Apply (member login)
                      </Link>
                      {o.guidelines_url && (
                        <a href={o.guidelines_url} target="_blank" rel="noopener" className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">
                          Guidelines
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {awarded.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-6">Recent awards</h2>
            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {awarded.slice(0, 10).map((o) => (
                <div key={o.id} className="py-4 flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{o.issuer || 'Council'}</p>
                    <p className="font-medium">{o.title}</p>
                  </div>
                  {o.total_pool_rands && <p className="text-sm font-mono text-gray-500">{formatRand(o.total_pool_rands)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-16 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Not a member yet?</h3>
          <p className="text-sm text-gray-600 mb-4">Grant eligibility requires CDCC membership. Enrolment is free for affiliate practitioners.</p>
          <Link href="/join" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white transition-colors">
            Join the Council →
          </Link>
        </div>
      </div>
    </div>
  );
}
