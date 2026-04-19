'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { supabaseErrorMessage } from '@/lib/utils';

interface Group {
  id: number;
  slug: string;
  discipline: string;
  name: string;
  description: string | null;
  convenor_member_id: number | null;
  meeting_cadence: string | null;
  meeting_day: string | null;
  joinable: boolean;
  active: boolean;
}

interface Counts { [key: number]: number }

export default function AdminWorkingGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('working_groups').select('*').order('name');
    setGroups((data || []) as Group[]);

    const memberCounts: Counts = {};
    for (const g of (data || []) as Group[]) {
      const { count } = await supabase.from('working_group_members').select('*', { count: 'exact', head: true }).eq('working_group_id', g.id).is('left_at', null);
      memberCounts[g.id] = count || 0;
    }
    setCounts(memberCounts);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('working_groups').update(editing).eq('id', editing.id);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Working groups</h1>
      <p className="text-sm text-gray-500 mb-8">14 discipline-specific sub-councils. Manage convenors, cadence, and activity.</p>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Discipline</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Members</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Cadence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Active</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-700">{g.discipline}</td>
                <td className="px-4 py-3 font-medium">{g.name}</td>
                <td className="px-4 py-3 text-right">{counts[g.id] ?? 0}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{g.meeting_cadence || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${g.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {g.active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <Link href={`/portal/working-groups/${g.slug}`} target="_blank" className="text-gray-500 hover:text-black mr-3">View →</Link>
                  <button onClick={() => setEditing(g)} className="text-gray-500 hover:text-black">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold mb-4">{editing.name}</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span>
                <textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Cadence</span>
                  <select value={editing.meeting_cadence ?? 'monthly'} onChange={(e) => setEditing({ ...editing, meeting_cadence: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="bi_annual">Bi-annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Meeting day</span>
                  <input value={editing.meeting_day ?? ''} onChange={(e) => setEditing({ ...editing, meeting_day: e.target.value })} placeholder="3rd Wed" className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.joinable} onChange={(e) => setEditing({ ...editing, joinable: e.target.checked })} />
                  Joinable
                </label>
              </div>
              {message && <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 disabled:opacity-50">Save</button>
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
