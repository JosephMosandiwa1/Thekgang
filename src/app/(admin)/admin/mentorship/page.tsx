'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Profile { id: number; member_id: number; role: string; disciplines: string[]; experience_years: number | null; active: boolean; members?: { full_name: string } | null }
interface Match { id: number; mentor_id: number; mentee_id: number; status: string; started_at: string | null; ended_at: string | null; goals: string | null }

export default function AdminMentorship() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profiles' | 'matches'>('matches');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [p, m] = await Promise.all([
      supabase.from('mentorship_profiles').select('*, members(full_name)').order('created_at', { ascending: false }),
      supabase.from('mentorship_matches').select('*').order('created_at', { ascending: false }),
    ]);
    setProfiles(((p.data || []) as unknown) as Profile[]);
    setMatches((m.data || []) as Match[]);
    setLoading(false);
  }

  async function update(mt: Match, status: string) {
    if (!supabase) return;
    const patch: { status: string; started_at?: string; ended_at?: string } = { status };
    if (status === 'active' && !mt.started_at) patch.started_at = new Date().toISOString().split('T')[0];
    if ((status === 'completed' || status === 'cancelled') && !mt.ended_at) patch.ended_at = new Date().toISOString().split('T')[0];
    await supabase.from('mentorship_matches').update(patch).eq('id', mt.id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Mentorship</h1>
      <p className="text-sm text-gray-500 mb-8">Profiles · pairings · activity</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border border-gray-200 p-3"><p className="text-[10px] uppercase text-gray-500">Mentors</p><p className="text-2xl font-bold">{profiles.filter((p) => p.role === 'mentor' || p.role === 'both').length}</p></div>
        <div className="border border-gray-200 p-3"><p className="text-[10px] uppercase text-gray-500">Mentees</p><p className="text-2xl font-bold">{profiles.filter((p) => p.role === 'mentee' || p.role === 'both').length}</p></div>
        <div className="border border-gray-200 p-3"><p className="text-[10px] uppercase text-gray-500">Active matches</p><p className="text-2xl font-bold">{matches.filter((m) => m.status === 'active').length}</p></div>
        <div className="border border-gray-200 p-3"><p className="text-[10px] uppercase text-gray-500">Proposed</p><p className="text-2xl font-bold">{matches.filter((m) => m.status === 'proposed').length}</p></div>
      </div>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        <button onClick={() => setTab('matches')} className={`pb-3 text-sm border-b-2 ${tab === 'matches' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>Matches ({matches.length})</button>
        <button onClick={() => setTab('profiles')} className={`pb-3 text-sm border-b-2 ${tab === 'profiles' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>Profiles ({profiles.length})</button>
      </div>

      {tab === 'matches' ? (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Mentor</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Mentee</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Started</th><th className="text-right px-4 py-3"></th></tr></thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">member #{m.mentor_id}</td>
                  <td className="px-4 py-3">member #{m.mentee_id}</td>
                  <td className="px-4 py-3">
                    <select value={m.status} onChange={(e) => update(m, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                      {['proposed', 'active', 'paused', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m.started_at ? formatDate(m.started_at, 'short') : '—'}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{m.goals?.slice(0, 40)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Member</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Role</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Disciplines</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Experience</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Active</th></tr></thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{p.members?.full_name || `#${p.member_id}`}</td>
                  <td className="px-4 py-3 text-xs">{p.role}</td>
                  <td className="px-4 py-3 text-xs">{p.disciplines.join(', ')}</td>
                  <td className="px-4 py-3 text-right text-xs">{p.experience_years || '—'} yrs</td>
                  <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.active ? 'yes' : 'no'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
