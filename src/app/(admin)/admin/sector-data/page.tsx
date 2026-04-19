'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, supabaseErrorMessage } from '@/lib/utils';

interface Period {
  id: number;
  year: number;
  period_type: string;
  period_label: string;
  open_date: string;
  close_date: string;
  status: string;
  public_report_url: string | null;
}

interface Submission {
  id: number;
  period_id: number;
  discipline: string;
  organisation: string | null;
  titles_published: number | null;
  revenue_rands: number | null;
  employees_fte: number | null;
  status: string;
  submitted_at: string | null;
  members?: { full_name: string; member_number: string | null } | null;
}

const EMPTY_PERIOD: Partial<Period> = { period_type: 'annual', status: 'draft' };

export default function AdminSectorData() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Period>>(EMPTY_PERIOD);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: p } = await supabase.from('sector_data_periods').select('*').order('close_date', { ascending: false });
    setPeriods((p || []) as Period[]);
    if (p && p.length > 0 && !activePeriod) {
      setActivePeriod((p[0] as Period).id);
      const { data: s } = await supabase.from('sector_data_submissions').select('*, members(full_name, member_number)').eq('period_id', (p[0] as Period).id).order('submitted_at', { ascending: false });
      setSubmissions(((s || []) as unknown) as Submission[]);
    }
    setLoading(false);
  }

  async function selectPeriod(id: number) {
    if (!supabase) return;
    setActivePeriod(id);
    const { data } = await supabase.from('sector_data_submissions').select('*, members(full_name, member_number)').eq('period_id', id).order('submitted_at', { ascending: false });
    setSubmissions(((data || []) as unknown) as Submission[]);
  }

  async function save() {
    if (!supabase || !editing.period_label || !editing.year) return;
    setMessage(null);
    const { error } = editing.id
      ? await supabase.from('sector_data_periods').update(editing).eq('id', editing.id)
      : await supabase.from('sector_data_periods').insert(editing);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setShowForm(false); setEditing(EMPTY_PERIOD); load(); }
  }

  async function verify(s: Submission, verified: boolean) {
    if (!supabase) return;
    await supabase.from('sector_data_submissions').update({
      status: verified ? 'verified' : 'rejected',
      verified_at: verified ? new Date().toISOString() : null,
    }).eq('id', s.id);
    if (activePeriod) selectPeriod(activePeriod);
  }

  const active = periods.find((p) => p.id === activePeriod);
  const verified = submissions.filter((s) => s.status === 'verified');
  const totalTitles = verified.reduce((sum, s) => sum + (s.titles_published ?? 0), 0);
  const totalRevenue = verified.reduce((sum, s) => sum + (Number(s.revenue_rands) ?? 0), 0);
  const totalFte = verified.reduce((sum, s) => sum + (s.employees_fte ?? 0), 0);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Sector data</h1>
          <p className="text-sm text-gray-500 mt-1">Annual submissions · aggregated sector report</p>
        </div>
        <button onClick={() => { setEditing(EMPTY_PERIOD); setShowForm(true); }} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">
          + New period
        </button>
      </div>

      {showForm && (
        <div className="border border-gray-200 p-5 mb-8 bg-gray-50">
          <div className="grid md:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Year</span>
              <input type="number" value={editing.year ?? ''} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Period label</span>
              <input value={editing.period_label ?? ''} onChange={(e) => setEditing({ ...editing, period_label: e.target.value })} placeholder="FY2026" className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Open date</span>
              <input type="date" value={editing.open_date ?? ''} onChange={(e) => setEditing({ ...editing, open_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Close date</span>
              <input type="date" value={editing.close_date ?? ''} onChange={(e) => setEditing({ ...editing, close_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
              <select value={editing.status ?? 'draft'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm">
                {['draft', 'open', 'closed', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {message && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-black">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-8">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPeriod(p.id)}
            className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${activePeriod === p.id ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
          >
            {p.period_label}
          </button>
        ))}
        {periods.length === 0 && <p className="text-sm text-gray-500">No periods defined yet.</p>}
      </div>

      {active && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Submissions</p>
              <p className="text-2xl font-bold mt-1">{submissions.length}</p>
            </div>
            <div className="border border-green-200 bg-green-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Verified</p>
              <p className="text-2xl font-bold mt-1 text-green-700">{verified.length}</p>
            </div>
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Aggregate titles</p>
              <p className="text-2xl font-bold mt-1">{totalTitles.toLocaleString()}</p>
            </div>
            <div className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Aggregate revenue</p>
              <p className="text-lg font-bold mt-1 font-mono">{formatRand(totalRevenue)}</p>
              <p className="text-[10px] text-gray-500 mt-1">FTE: {totalFte}</p>
            </div>
          </div>

          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Discipline</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Titles</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Revenue</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Submitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">{s.members?.full_name || '—'}<div className="text-[10px] text-gray-400">{s.members?.member_number}</div></td>
                    <td className="px-4 py-3 text-gray-700">{s.discipline}</td>
                    <td className="px-4 py-3 text-right">{s.titles_published ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{s.revenue_rands ? formatRand(s.revenue_rands) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                        s.status === 'verified' ? 'bg-green-100 text-green-700'
                          : s.status === 'submitted' ? 'bg-amber-100 text-amber-700'
                          : s.status === 'rejected' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.submitted_at ? formatDate(s.submitted_at, 'short') : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'submitted' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => verify(s, true)} className="text-xs text-green-700 hover:underline">Verify</button>
                          <button onClick={() => verify(s, false)} className="text-xs text-red-700 hover:underline">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No submissions yet for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
