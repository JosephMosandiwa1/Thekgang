'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Policy {
  id: number;
  title: string;
  subject: string | null;
  target_body: string | null;
  reference_code: string | null;
  status: string;
  submission_date: string | null;
  response_received_at: string | null;
  response_notes: string | null;
  executive_summary: string | null;
  full_text: string | null;
  members?: { full_name: string } | null;
  working_groups?: { name: string } | null;
}

const STATUS_OPTIONS = ['draft', 'in_review', 'approved', 'submitted', 'responded', 'withdrawn'];

export default function AdminPolicy() {
  const [items, setItems] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Policy | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from('policy_submissions')
      .select('*, members:author_member_id(full_name), working_groups:working_group_id(name)')
      .order('created_at', { ascending: false });
    setItems(((data || []) as unknown) as Policy[]);
    setLoading(false);
  }

  async function update(p: Policy, patch: Partial<Policy>) {
    if (!supabase) return;
    await supabase.from('policy_submissions').update(patch).eq('id', p.id);
    load();
    if (selected && selected.id === p.id) setSelected({ ...selected, ...patch });
  }

  async function assignReferenceAndSubmit(p: Policy) {
    const year = new Date().getFullYear();
    const next = items.filter((x) => x.reference_code?.includes(`CDCC-POL-${year}`)).length + 1;
    const ref = `CDCC-POL-${year}-${String(next).padStart(3, '0')}`;
    await update(p, { reference_code: ref, status: 'submitted', submission_date: new Date().toISOString().split('T')[0] });
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Policy submissions</h1>
      <p className="text-sm text-gray-500 mb-8">Positions carried by the Council to Parliament, DSAC, and sector bodies.</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {['in_review', 'submitted', 'responded', 'approved'].map((s) => (
          <div key={s} className="border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{s.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-bold mt-1">{items.filter((p) => p.status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Author</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Target</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(p)}>
                <td className="px-4 py-3 font-mono text-xs">{p.reference_code || '—'}</td>
                <td className="px-4 py-3 font-medium">{p.title}{p.subject && <span className="block text-xs text-gray-500">{p.subject}</span>}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{p.members?.full_name || '—'}{p.working_groups?.name && <div className="text-[10px] text-gray-400">{p.working_groups.name}</div>}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{p.target_body || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => update(p, { status: e.target.value })}
                    className="text-xs px-2 py-1 border border-gray-200 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  {p.status === 'approved' && !p.reference_code && (
                    <button onClick={(e) => { e.stopPropagation(); assignReferenceAndSubmit(p); }} className="text-xs text-black hover:underline">Assign ref &amp; submit</button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No policy submissions yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{selected.reference_code || 'Draft'} · {selected.status}</p>
            <h2 className="font-display text-xl font-bold mb-2">{selected.title}</h2>
            {selected.subject && <p className="text-sm text-gray-600 mb-1">Subject: {selected.subject}</p>}
            {selected.target_body && <p className="text-sm text-gray-600 mb-4">Target: {selected.target_body}</p>}
            {selected.executive_summary && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Executive summary</p>
                <p className="text-sm whitespace-pre-wrap">{selected.executive_summary}</p>
              </div>
            )}
            {selected.full_text && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Full text</p>
                <p className="text-sm whitespace-pre-wrap">{selected.full_text}</p>
              </div>
            )}
            {selected.submission_date && <p className="text-xs text-gray-500">Submitted: {formatDate(selected.submission_date, 'long')}</p>}
            {selected.response_notes && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Response</p>
                <p className="text-sm whitespace-pre-wrap">{selected.response_notes}</p>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-5 text-xs text-gray-500 hover:text-black">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
