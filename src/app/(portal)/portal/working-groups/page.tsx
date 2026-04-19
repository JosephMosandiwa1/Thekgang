'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Group {
  id: number;
  slug: string;
  discipline: string;
  name: string;
  description: string | null;
  meeting_cadence: string | null;
  joinable: boolean;
  active: boolean;
}

interface Membership { working_group_id: number; role: string }

export default function PortalWorkingGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const mem = m as { id: number };
      setMemberId(mem.id);
      const { data: mships } = await supabase.from('working_group_members').select('working_group_id, role').eq('member_id', mem.id).is('left_at', null);
      setMemberships(((mships || []) as unknown) as Membership[]);
    }
    const { data } = await supabase.from('working_groups').select('*').eq('active', true).order('name');
    setGroups(((data || []) as unknown) as Group[]);
    setLoading(false);
  }

  async function toggleMembership(g: Group) {
    if (!supabase || !memberId) return;
    setBusy(g.id);
    const existing = memberships.find((m) => m.working_group_id === g.id);
    if (existing) {
      await supabase
        .from('working_group_members')
        .update({ left_at: new Date().toISOString() })
        .eq('working_group_id', g.id).eq('member_id', memberId);
    } else {
      await supabase.from('working_group_members').insert({
        working_group_id: g.id,
        member_id: memberId,
        role: 'member',
      });
    }
    setBusy(null);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Discipline councils</p>
      <h1 className="font-display text-3xl font-bold mb-2">Working groups</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        14 discipline-specific sub-councils. Join the groups that match your practice to vote, shape policy submissions, and access group-specific resources.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {groups.map((g) => {
          const joined = memberships.some((m) => m.working_group_id === g.id);
          return (
            <div key={g.id} className="border border-gray-200 p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{g.discipline}</p>
              <h3 className="font-display text-lg font-bold mb-2">{g.name}</h3>
              {g.description && <p className="text-sm text-gray-600 mb-3">{g.description}</p>}
              <p className="text-xs text-gray-500 mb-4">Meets {g.meeting_cadence || 'monthly'}</p>
              <div className="flex items-center gap-3">
                <Link href={`/portal/working-groups/${g.slug}`} className="text-xs uppercase tracking-wider border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors">
                  View group
                </Link>
                <button
                  onClick={() => toggleMembership(g)}
                  disabled={busy === g.id || !g.joinable}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors disabled:opacity-50 ${
                    joined ? 'border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-600' : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {busy === g.id ? '…' : joined ? 'Leave' : 'Join'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
