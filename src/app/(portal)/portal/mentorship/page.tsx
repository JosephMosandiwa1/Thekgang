'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CDCC_DISCIPLINES, supabaseErrorMessage } from '@/lib/utils';

interface Profile { id?: number; member_id: number; role: string; disciplines: string[]; experience_years: number | null; bio: string | null; goals: string | null; availability: string | null; active: boolean }
interface Match { id: number; mentor_id: number; mentee_id: number; status: string; goals: string | null; started_at: string | null }
interface MemberCard { id: number; full_name: string; disciplines: string[]; bio: string | null; organisation: string | null }

export default function PortalMentorship() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [potentials, setPotentials] = useState<(MemberCard & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (!m) { setLoading(false); return; }
    const mem = m as { id: number };
    setMemberId(mem.id);

    const { data: p } = await supabase.from('mentorship_profiles').select('*').eq('member_id', mem.id).maybeSingle();
    if (p) setProfile(p as Profile);
    else setProfile({ member_id: mem.id, role: 'mentee', disciplines: [], experience_years: null, bio: null, goals: null, availability: null, active: true });

    const { data: myMatches } = await supabase.from('mentorship_matches').select('*').or(`mentor_id.eq.${mem.id},mentee_id.eq.${mem.id}`).order('created_at', { ascending: false });
    setMatches(((myMatches || []) as unknown) as Match[]);

    // Find potential matches (opposite role · overlapping disciplines)
    if (p) {
      const oppositeRole = (p as Profile).role === 'mentor' ? 'mentee' : 'mentor';
      const { data: others } = await supabase
        .from('mentorship_profiles')
        .select('member_id, role, disciplines, bio, members(id, full_name, organisation, bio)')
        .neq('member_id', mem.id)
        .eq('active', true)
        .in('role', [oppositeRole, 'both'])
        .limit(20);
      const enriched = ((others || []) as unknown as Array<{ member_id: number; role: string; disciplines: string[]; bio: string | null; members: { id: number; full_name: string; organisation: string | null; bio: string | null } | null }>).map((o) => ({
        id: o.member_id,
        full_name: o.members?.full_name || '',
        disciplines: o.disciplines,
        bio: o.bio || o.members?.bio || null,
        organisation: o.members?.organisation || null,
        profile: { id: 0, member_id: o.member_id, role: o.role, disciplines: o.disciplines, experience_years: null, bio: o.bio || null, goals: null, availability: null, active: true } as Profile,
      }));
      setPotentials(enriched);
    }

    setLoading(false);
  }

  async function saveProfile() {
    if (!supabase || !profile || !memberId) return;
    setSaving(true); setMessage(null);
    const record = { ...profile, member_id: memberId };
    const { error } = profile.id ? await supabase.from('mentorship_profiles').update(record).eq('id', profile.id) : await supabase.from('mentorship_profiles').insert(record);
    if (error) setMessage(supabaseErrorMessage(error)); else setMessage('Saved.');
    setSaving(false);
    load();
  }

  async function propose(otherId: number) {
    if (!supabase || !profile || !memberId) return;
    const isMentor = profile.role === 'mentor' || profile.role === 'both';
    const mentor_id = isMentor ? memberId : otherId;
    const mentee_id = isMentor ? otherId : memberId;
    await supabase.from('mentorship_matches').insert({ mentor_id, mentee_id, status: 'proposed' });
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Mentorship</p>
      <h1 className="font-display text-3xl font-bold mb-2">Mentors &amp; mentees</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">Be paired with a practitioner who has walked the road you&apos;re on — or guide one who&apos;s starting out.</p>

      <section className="mb-10 border border-gray-200 p-5">
        <h2 className="font-display text-lg font-bold mb-4">Your profile</h2>
        {profile && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Role</span>
                <select value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                  <option value="mentor">Mentor</option><option value="mentee">Mentee</option><option value="both">Both</option>
                </select>
              </label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Years experience</span><input type="number" value={profile.experience_years ?? ''} onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="flex items-center gap-2 text-sm pt-6"><input type="checkbox" checked={profile.active} onChange={(e) => setProfile({ ...profile, active: e.target.checked })} />Open to matches</label>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Disciplines</span>
              <div className="flex flex-wrap gap-1.5">
                {CDCC_DISCIPLINES.map((d) => (
                  <button key={d} type="button" onClick={() => setProfile({ ...profile, disciplines: profile.disciplines.includes(d) ? profile.disciplines.filter((x) => x !== d) : [...profile.disciplines, d] })} className={`px-2 py-1 text-xs border ${profile.disciplines.includes(d) ? 'bg-black text-white border-black' : 'border-gray-300'}`}>{d}</button>
                ))}
              </div>
            </div>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Bio</span><textarea rows={3} value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Goals</span><textarea rows={2} value={profile.goals || ''} onChange={(e) => setProfile({ ...profile, goals: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Availability</span><input value={profile.availability || ''} onChange={(e) => setProfile({ ...profile, availability: e.target.value })} placeholder="e.g. 1 hour fortnightly, evenings" className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
            <div className="flex items-center gap-3">
              <button onClick={saveProfile} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">{saving ? 'Saving…' : 'Save profile'}</button>
              {message && <span className="text-xs text-gray-600">{message}</span>}
            </div>
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold mb-4">Potential matches</h2>
        {potentials.length === 0 ? <p className="text-sm text-gray-500">No matches yet — add more disciplines to your profile to widen the pool.</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {potentials.map((p) => (
              <div key={p.id} className="border border-gray-200 p-5">
                <p className="font-medium">{p.full_name}</p>
                {p.organisation && <p className="text-xs text-gray-500">{p.organisation}</p>}
                <p className="text-[10px] uppercase text-gray-500 mt-1">{p.profile.role} · {p.disciplines.slice(0, 3).join(' · ')}</p>
                {p.bio && <p className="text-sm text-gray-700 mt-2 line-clamp-3">{p.bio}</p>}
                <button onClick={() => propose(p.id)} className="mt-3 bg-black text-white text-xs uppercase tracking-wider px-4 py-1.5">Propose match</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-4">Your matches</h2>
        {matches.length === 0 ? <p className="text-sm text-gray-500">No matches yet.</p> : (
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="border border-gray-200 p-3 flex justify-between">
                <span className="text-sm">{m.mentor_id === memberId ? 'Mentor of' : 'Mentee of'} member #{m.mentor_id === memberId ? m.mentee_id : m.mentor_id}</span>
                <span className="text-[10px] uppercase bg-gray-100 px-2 py-0.5">{m.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
