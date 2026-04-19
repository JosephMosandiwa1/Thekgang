'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Vol { id: number; full_name: string; email: string; phone: string | null; interests: string[]; skills: string[]; availability: string | null; status: string; hours_logged: number; created_at: string }

export default function AdminVolunteers() {
  const [rows, setRows] = useState<Vol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('volunteers').select('*').order('created_at', { ascending: false });
    setRows((data || []) as Vol[]);
    setLoading(false);
  }

  async function updateStatus(v: Vol, status: string) {
    if (!supabase) return;
    await supabase.from('volunteers').update({ status }).eq('id', v.id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Volunteers</h1>
      <p className="text-sm text-gray-500 mb-8">People helping the Council outside the staff team</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 p-4"><p className="text-[10px] uppercase text-gray-500">Active</p><p className="text-2xl font-bold">{rows.filter((r) => r.status === 'active').length}</p></div>
        <div className="border border-gray-200 p-4"><p className="text-[10px] uppercase text-gray-500">Inactive</p><p className="text-2xl font-bold">{rows.filter((r) => r.status === 'inactive').length}</p></div>
        <div className="border border-gray-200 p-4"><p className="text-[10px] uppercase text-gray-500">Hours logged</p><p className="text-2xl font-bold">{rows.reduce((s, r) => s + Number(r.hours_logged || 0), 0)}</p></div>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Contact</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Interests</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Availability</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Hours</th></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{v.full_name}</td>
                <td className="px-4 py-3 text-xs">{v.email}{v.phone && <div className="text-gray-500">{v.phone}</div>}</td>
                <td className="px-4 py-3 text-xs">{v.interests.join(', ')}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{v.availability || '—'}</td>
                <td className="px-4 py-3">
                  <select value={v.status} onChange={(e) => updateStatus(v, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="rotated_out">Rotated out</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{v.hours_logged}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
