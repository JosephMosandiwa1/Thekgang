'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';

interface Agm { id: number; year: number; meeting_date: string | null; venue: string | null; virtual_link: string | null; status: string }
interface Res { id: number; agm_id: number; resolution_number: string | null; title: string; motion: string; background: string | null; passed: boolean | null; votes_for: number; votes_against: number; votes_abstain: number; order_index: number }

export default function PortalAgmDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agmId = Number(id);
  const [agm, setAgm] = useState<Agm | null>(null);
  const [resolutions, setResolutions] = useState<Res[]>([]);
  const [ballots, setBallots] = useState<Record<number, string>>({});
  const [memberId, setMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => { load(); }, [agmId]);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (m) setMemberId((m as { id: number }).id);

    const [a, r] = await Promise.all([
      supabase.from('agm_events').select('*').eq('id', agmId).maybeSingle(),
      supabase.from('agm_resolutions').select('*').eq('agm_id', agmId).order('order_index'),
    ]);
    setAgm((a.data as Agm) || null);
    setResolutions((r.data || []) as Res[]);

    if (m) {
      const { data: b } = await supabase.from('agm_ballots').select('resolution_id, choice').eq('member_id', (m as { id: number }).id);
      const map: Record<number, string> = {};
      (b || []).forEach((x: { resolution_id: number; choice: string }) => { map[x.resolution_id] = x.choice; });
      setBallots(map);
    }

    setLoading(false);
  }

  async function vote(resolutionId: number, choice: 'for' | 'against' | 'abstain') {
    if (!supabase || !memberId) return;
    setSaving(resolutionId);
    await supabase.from('agm_ballots').upsert({ resolution_id: resolutionId, member_id: memberId, choice }, { onConflict: 'resolution_id,member_id' });
    setBallots({ ...ballots, [resolutionId]: choice });
    setSaving(null);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!agm) return <p>AGM not found. <Link href="/portal/agm" className="underline">Back</Link></p>;

  const canVote = agm.status === 'open' || agm.status === 'voting';

  return (
    <div>
      <Link href="/portal/agm" className="text-xs text-gray-500 hover:text-black">← AGMs</Link>
      <div className="mt-4 mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">AGM · {agm.status}</p>
        <h1 className="font-display text-3xl font-bold">AGM {agm.year}</h1>
        {agm.meeting_date && <p className="text-sm text-gray-500 mt-1">{formatDateTime(agm.meeting_date)}</p>}
        {agm.venue && <p className="text-sm text-gray-500 mt-1">{agm.venue}</p>}
        {agm.virtual_link && <a href={agm.virtual_link} target="_blank" rel="noopener" className="text-sm text-black underline mt-1 inline-block">Join online →</a>}
      </div>

      {!canVote && <div className="mb-6 p-3 bg-gray-50 border border-gray-200 text-sm text-gray-600">Voting is not open. {agm.status === 'closed' && 'Results below.'}</div>}

      <h2 className="font-display text-xl font-bold mb-4">Resolutions</h2>
      <div className="space-y-4">
        {resolutions.map((r) => {
          const myChoice = ballots[r.id];
          return (
            <div key={r.id} className="border border-gray-200 p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{r.resolution_number || `Resolution ${r.order_index / 10}`}</p>
              <h3 className="font-display text-lg font-bold">{r.title}</h3>
              <p className="text-sm text-gray-700 mt-2">{r.motion}</p>
              {r.background && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{r.background}</p>}

              {canVote && (
                <div className="mt-5 flex gap-2 flex-wrap">
                  {(['for', 'against', 'abstain'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => vote(r.id, opt)}
                      disabled={saving === r.id}
                      className={`text-xs uppercase tracking-wider px-4 py-2 border transition-colors ${
                        myChoice === opt ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'
                      } disabled:opacity-50`}
                    >
                      {opt}
                    </button>
                  ))}
                  {myChoice && <span className="text-xs text-green-700 self-center ml-2">✓ Your vote recorded</span>}
                </div>
              )}

              {!canVote && r.passed !== null && (
                <div className="mt-5 flex gap-4 text-xs font-mono">
                  <span>For: <strong>{r.votes_for}</strong></span>
                  <span>Against: <strong>{r.votes_against}</strong></span>
                  <span>Abstain: <strong>{r.votes_abstain}</strong></span>
                  <span className={`ml-auto uppercase tracking-wider px-2 py-0.5 ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.passed ? 'Passed' : 'Failed'}</span>
                </div>
              )}
            </div>
          );
        })}
        {resolutions.length === 0 && <p className="text-sm text-gray-500">No resolutions tabled yet.</p>}
      </div>
    </div>
  );
}
