'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Subscriber {
  id: number;
  email: string;
  full_name: string | null;
  province: string | null;
  disciplines: string[];
  source: string | null;
  verified: boolean;
  unsubscribed: boolean;
  created_at: string;
}

export default function AdminSubscribers() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'unsubscribed'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }).limit(500);
    setSubs((data || []) as Subscriber[]);
    setLoading(false);
  }

  async function exportCsv() {
    if (subs.length === 0) return;
    const rows = [
      ['email', 'full_name', 'province', 'disciplines', 'source', 'verified', 'unsubscribed', 'created_at'],
      ...subs.map((s) => [
        s.email, s.full_name || '', s.province || '',
        s.disciplines.join('|'), s.source || '',
        s.verified ? 'y' : 'n', s.unsubscribed ? 'y' : 'n',
        s.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdcc-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = subs.filter((s) => {
    if (filter === 'verified' && !s.verified) return false;
    if (filter === 'pending' && s.verified) return false;
    if (filter === 'unsubscribed' && !s.unsubscribed) return false;
    if (filter !== 'unsubscribed' && s.unsubscribed) return false;
    if (q && !s.email.toLowerCase().includes(q.toLowerCase()) && !(s.full_name || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Subscribers</h1>
          <p className="text-sm text-gray-500 mt-1">All newsletter subscribers · verified + pending</p>
        </div>
        <button onClick={exportCsv} className="text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white">Export CSV</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={subs.length} filter={filter === 'all'} onClick={() => setFilter('all')} />
        <Stat label="Verified" value={subs.filter((s) => s.verified && !s.unsubscribed).length} filter={filter === 'verified'} onClick={() => setFilter('verified')} />
        <Stat label="Pending verify" value={subs.filter((s) => !s.verified && !s.unsubscribed).length} filter={filter === 'pending'} onClick={() => setFilter('pending')} />
        <Stat label="Unsubscribed" value={subs.filter((s) => s.unsubscribed).length} filter={filter === 'unsubscribed'} onClick={() => setFilter('unsubscribed')} />
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or name…" className="w-full md:max-w-md px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black mb-4" />

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Province</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Source</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.full_name || '—'}</td>
                <td className="px-4 py-3 text-xs">{s.province || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.source || '—'}</td>
                <td className="px-4 py-3 text-center">
                  {s.unsubscribed
                    ? <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5">unsub</span>
                    : s.verified
                      ? <span className="text-[10px] uppercase bg-green-100 text-green-700 px-2 py-0.5">verified</span>
                      : <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-2 py-0.5">pending</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.created_at, 'short')}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No subscribers match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, filter, onClick }: { label: string; value: number; filter: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-left border p-4 transition-colors ${filter ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </button>
  );
}
