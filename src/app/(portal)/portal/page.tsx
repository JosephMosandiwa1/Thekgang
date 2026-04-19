'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, initials } from '@/lib/utils';

interface Member {
  id: number;
  full_name: string;
  member_number: string | null;
  tier_id: number | null;
  disciplines: string[];
  joined_at: string;
  renewal_due: string | null;
  verified: boolean;
  email: string;
  province: string | null;
}

interface Tier { id: number; name: string; slug: string }
interface EventStub { id: number; title: string; event_date: string; venue: string | null; slug: string | null }

export default function PortalOverview() {
  const [member, setMember] = useState<Member | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [upcoming, setUpcoming] = useState<EventStub[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (m) {
        setMember(m as Member);
        if ((m as Member).tier_id) {
          const { data: t } = await supabase
            .from('member_tiers')
            .select('*')
            .eq('id', (m as Member).tier_id as number)
            .maybeSingle();
          setTier(t as Tier | null);
        }
        const { count } = await supabase
          .from('member_certificates')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', (m as Member).id);
        setCertCount(count || 0);
      }

      const { data: ev } = await supabase
        .from('events')
        .select('id, title, event_date, venue, slug, status')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .eq('status', 'published')
        .order('event_date')
        .limit(5);
      setUpcoming(((ev || []) as unknown) as EventStub[]);

      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  if (!member) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome</h1>
        <p className="text-gray-600 mb-6">
          Your Council member record hasn&apos;t been set up yet. Complete your enrolment to activate full member access.
        </p>
        <Link href="/portal/profile" className="inline-block bg-black text-white text-xs uppercase tracking-wider px-5 py-3 hover:bg-gray-800">
          Complete profile
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-6 mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Welcome back</p>
          <h1 className="font-display text-4xl font-bold text-black mb-2">{member.full_name.split(' ')[0]}.</h1>
          <p className="text-sm text-gray-600 max-w-lg">
            {tier?.name || 'Member'} · {member.disciplines.length} {member.disciplines.length === 1 ? 'discipline' : 'disciplines'} ·
            joined {formatDate(member.joined_at, 'short')}
          </p>
        </div>
        <div className="flex items-center gap-3 border border-gray-200 px-5 py-3">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
            {initials(member.full_name)}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">Member</p>
            <p className="font-mono text-sm text-black">{member.member_number}</p>
          </div>
        </div>
      </div>

      {/* Three tiles */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <Link href="/portal/events" className="border border-gray-200 p-6 hover:border-black transition-colors block">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-2">Upcoming events</p>
          <p className="font-display text-3xl font-bold text-black">{upcoming.length}</p>
          <p className="text-xs text-gray-500 mt-1">Next 60 days</p>
        </Link>
        <Link href="/portal/certificates" className="border border-gray-200 p-6 hover:border-black transition-colors block">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-2">Your certificates</p>
          <p className="font-display text-3xl font-bold text-black">{certCount}</p>
          <p className="text-xs text-gray-500 mt-1">Verifiable credentials</p>
        </Link>
        <Link href="/portal/benefits" className="border border-gray-200 p-6 hover:border-black transition-colors block">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-2">Member benefits</p>
          <p className="font-display text-3xl font-bold text-black">{tier?.slug === 'active' ? '8' : '5'}</p>
          <p className="text-xs text-gray-500 mt-1">Active today</p>
        </Link>
      </div>

      {/* Upcoming events */}
      <section>
        <h2 className="font-display text-xl font-bold mb-4">Next up</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No events scheduled yet. <Link href="/events" className="underline">Browse all events →</Link></p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events/${e.slug || e.id}`} className="flex items-center justify-between py-4 hover:bg-gray-50 px-2 -mx-2 transition-colors">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{formatDate(e.event_date, 'short')}</p>
                  <p className="font-medium">{e.title}</p>
                  {e.venue && <p className="text-xs text-gray-500 mt-1">{e.venue}</p>}
                </div>
                <span className="text-xs text-gray-400">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
