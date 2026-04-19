'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, slugify, supabaseErrorMessage } from '@/lib/utils';

interface Opp {
  id: number;
  slug: string | null;
  title: string;
  issuer: string | null;
  description: string | null;
  eligibility: string | null;
  amount_rands: number | null;
  total_pool_rands: number | null;
  discipline_tags: string[];
  opens_at: string | null;
  closes_at: string | null;
  decision_date: string | null;
  guidelines_url: string | null;
  status: string;
}
interface App {
  id: number;
  opportunity_id: number;
  applicant_name: string;
  applicant_email: string;
  project_title: string;
  project_description: string | null;
  amount_requested_rands: number | null;
  amount_awarded_rands: number | null;
  review_score: number | null;
  review_notes: string | null;
  status: string;
  created_at: string;
}

const STATUS = ['draft', 'open', 'closing', 'closed', 'awarded', 'archived'];
const APP_STATUS = ['submitted', 'under_review', 'shortlisted', 'awarded', 'declined', 'withdrawn'];

export default function AdminGrants() {
  const [opps, setOpps] = useState<Opp[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'opps' | 'apps'>('opps');
  const [editing, setEditing] = useState<Partial<Opp> | null>(null);
  const [reviewing, setReviewing] = useState<App | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [o, a] = await Promise.all([
      supabase.from('grant_opportunities').select('*').order('closes_at', { ascending: false, nullsFirst: false }),
      supabase.from('grant_applications').select('*').order('created_at', { ascending: false }),
    ]);
    setOpps(((o.data || []) as unknown) as Opp[]);
    setApps(((a.data || []) as unknown) as App[]);
    setLoading(false);
  }

  async function saveOpp() {
    if (!supabase || !editing?.title) return;
    setSaving(true); setMessage(null);
    const record = {
      ...editing,
      slug: editing.slug || slugify(editing.title),
    };
    const { error } = editing.id
      ? await supabase.from('grant_opportunities').update(record).eq('id', editing.id)
      : await supabase.from('grant_opportunities').insert(record);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
    setSaving(false);
  }

  async function decideApp(a: App, status: string, award?: number | null) {
    if (!supabase) return;
    await supabase.from('grant_applications').update({
      status,
      amount_awarded_rands: award ?? a.amount_awarded_rands,
      decision_at: new Date().toISOString(),
    }).eq('id', a.id);
    load();
    setReviewing(null);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Grants &amp; bursaries</h1>
          <p className="text-sm text-gray-500 mt-1">Funding opportunities and applications</p>
        </div>
        {tab === 'opps' && (
          <button onClick={() => setEditing({ status: 'draft' })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">
            + New opportunity
          </button>
        )}
      </div>

      <div className="border-b border-gray-200 flex gap-6 mb-6">
        <button onClick={() => setTab('opps')} className={`pb-3 text-sm border-b-2 ${tab === 'opps' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>
          Opportunities ({opps.length})
        </button>
        <button onClick={() => setTab('apps')} className={`pb-3 text-sm border-b-2 ${tab === 'apps' ? 'border-black font-semibold' : 'border-transparent text-gray-500'}`}>
          Applications ({apps.length})
        </button>
      </div>

      {tab === 'opps' ? (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Issuer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Award</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Pool</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Closes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {opps.map((o) => (
                <tr key={o.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{o.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{o.issuer || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{o.amount_rands ? formatRand(o.amount_rands) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{o.total_pool_rands ? formatRand(o.total_pool_rands) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{o.closes_at ? formatDate(o.closes_at, 'short') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                      o.status === 'open' ? 'bg-green-100 text-green-700'
                        : o.status === 'closed' ? 'bg-gray-200 text-gray-600'
                        : o.status === 'awarded' ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(o)} className="text-xs text-gray-500 hover:text-black">Edit →</button>
                  </td>
                </tr>
              ))}
              {opps.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No opportunities yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Opportunity</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Requested</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Awarded</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const opp = opps.find((o) => o.id === a.opportunity_id);
                return (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">{a.applicant_name}<div className="text-[10px] text-gray-500">{a.applicant_email}</div></td>
                    <td className="px-4 py-3 font-medium">{a.project_title}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{opp?.title || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{a.amount_requested_rands ? formatRand(a.amount_requested_rands) : '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-green-700">{a.amount_awarded_rands ? formatRand(a.amount_awarded_rands) : '—'}</td>
                    <td className="px-4 py-3">
                      <select value={a.status} onChange={(e) => decideApp(a, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                        {APP_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setReviewing(a)} className="text-xs text-gray-500 hover:text-black">Review →</button>
                    </td>
                  </tr>
                );
              })}
              {apps.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit opportunity' : 'New opportunity'}</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span>
                <input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Issuer</span>
                <input value={editing.issuer ?? ''} onChange={(e) => setEditing({ ...editing, issuer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span>
                <textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Per-award amount (ZAR)</span>
                  <input type="number" value={editing.amount_rands ?? ''} onChange={(e) => setEditing({ ...editing, amount_rands: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Total pool (ZAR)</span>
                  <input type="number" value={editing.total_pool_rands ?? ''} onChange={(e) => setEditing({ ...editing, total_pool_rands: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Opens</span>
                  <input type="date" value={editing.opens_at ?? ''} onChange={(e) => setEditing({ ...editing, opens_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Closes</span>
                  <input type="date" value={editing.closes_at ?? ''} onChange={(e) => setEditing({ ...editing, closes_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editing.status ?? 'draft'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Guidelines URL</span>
                <input value={editing.guidelines_url ?? ''} onChange={(e) => setEditing({ ...editing, guidelines_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              {message && <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveOpp} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 disabled:opacity-50">Save</button>
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setReviewing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-2">{reviewing.project_title}</h3>
            <p className="text-sm text-gray-600 mb-1">{reviewing.applicant_name} · {reviewing.applicant_email}</p>
            <p className="text-sm text-gray-500 mb-4">Requested: {formatRend(reviewing.amount_requested_rands)}</p>
            {reviewing.project_description && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Project description</p>
                <p className="text-sm whitespace-pre-wrap">{reviewing.project_description}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap mt-5">
              <button onClick={() => decideApp(reviewing, 'shortlisted')} className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">Shortlist</button>
              <button onClick={() => {
                const a = prompt('Award amount (ZAR):', String(reviewing.amount_requested_rands ?? ''));
                if (a !== null) decideApp(reviewing, 'awarded', Number(a));
              }} className="bg-green-700 text-white text-xs uppercase tracking-wider px-4 py-2 hover:bg-green-800">Award</button>
              <button onClick={() => decideApp(reviewing, 'declined')} className="text-xs uppercase tracking-wider border border-red-300 text-red-700 px-4 py-2 hover:bg-red-50">Decline</button>
              <button onClick={() => setReviewing(null)} className="text-xs text-gray-500 ml-auto">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// local currency helper (avoid circular import in review modal)
function formatRend(n: number | null | undefined) {
  if (n == null) return '—';
  return formatRand(n);
}
