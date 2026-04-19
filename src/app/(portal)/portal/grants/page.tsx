'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, supabaseErrorMessage } from '@/lib/utils';

interface Opportunity {
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
  status: string;
  guidelines_url: string | null;
}

interface Application {
  id: number;
  opportunity_id: number;
  project_title: string;
  amount_requested_rands: number | null;
  amount_awarded_rands: number | null;
  status: string;
  created_at: string;
}

export default function PortalGrants() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<Opportunity | null>(null);
  const [form, setForm] = useState({ project_title: '', project_description: '', amount_requested: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id, full_name, email').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const mem = m as { id: number; full_name: string; email: string };
      setMemberId(mem.id);
      setMemberName(mem.full_name);
      setMemberEmail(mem.email);
      const { data: myApps } = await supabase.from('grant_applications').select('*').eq('member_id', mem.id).order('created_at', { ascending: false });
      setApps(((myApps || []) as unknown) as Application[]);
    }
    const { data } = await supabase.from('grant_opportunities').select('*').in('status', ['open', 'closing']).order('closes_at');
    setOpps(((data || []) as unknown) as Opportunity[]);
    setLoading(false);
  }

  async function submitApplication() {
    if (!supabase || !memberId || !applyingTo) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('grant_applications').insert({
      opportunity_id: applyingTo.id,
      member_id: memberId,
      applicant_name: memberName,
      applicant_email: memberEmail,
      project_title: form.project_title,
      project_description: form.project_description,
      amount_requested_rands: parseFloat(form.amount_requested) || null,
      status: 'submitted',
    });
    if (error) setMessage(supabaseErrorMessage(error));
    else { setApplyingTo(null); setForm({ project_title: '', project_description: '', amount_requested: '' }); load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Funding</p>
      <h1 className="font-display text-3xl font-bold mb-2">Grants &amp; bursaries</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        Funding opportunities from the Council, DSAC, NAC, and affiliated funders. Apply directly through the portal.
      </p>

      <section className="mb-12">
        <h2 className="font-display text-xl font-bold mb-4">Open opportunities</h2>
        {opps.length === 0 ? (
          <p className="text-sm text-gray-500">No open opportunities right now. Check back — new calls open regularly.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {opps.map((o) => (
              <div key={o.id} className="border border-gray-200 p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{o.issuer}</p>
                <h3 className="font-display text-lg font-bold mb-2">{o.title}</h3>
                {o.description && <p className="text-sm text-gray-600 mb-3">{o.description}</p>}
                <dl className="text-xs space-y-1 mb-4">
                  {o.amount_rands && <div><dt className="inline text-gray-500">Award: </dt><dd className="inline font-medium">{formatRand(o.amount_rands)}</dd></div>}
                  {o.total_pool_rands && <div><dt className="inline text-gray-500">Total pool: </dt><dd className="inline">{formatRand(o.total_pool_rands)}</dd></div>}
                  {o.closes_at && <div><dt className="inline text-gray-500">Closes: </dt><dd className="inline">{formatDate(o.closes_at, 'long')}</dd></div>}
                </dl>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setApplyingTo(o)} className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2 hover:bg-gray-800">
                    Apply
                  </button>
                  {o.guidelines_url && (
                    <a href={o.guidelines_url} target="_blank" rel="noopener" className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">
                      Guidelines
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {applyingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setApplyingTo(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">Apply for</p>
            <h3 className="font-display text-xl font-bold mb-4">{applyingTo.title}</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Project title *</span>
                <input value={form.project_title} onChange={(e) => setForm({ ...form, project_title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Project description *</span>
                <textarea rows={5} value={form.project_description} onChange={(e) => setForm({ ...form, project_description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Amount requested (ZAR)</span>
                <input type="number" value={form.amount_requested} onChange={(e) => setForm({ ...form, amount_requested: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
              </label>
              {message && <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitApplication} disabled={saving || !form.project_title} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Submitting…' : 'Submit application'}
              </button>
              <button onClick={() => setApplyingTo(null)} className="text-xs text-gray-500 hover:text-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Your applications</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-500">No applications yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {apps.map((a) => {
              const opp = opps.find((o) => o.id === a.opportunity_id);
              return (
                <div key={a.id} className="py-4 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{a.status}</p>
                    <p className="font-medium">{a.project_title}</p>
                    {opp && <p className="text-xs text-gray-500 mt-1">For: {opp.title}</p>}
                  </div>
                  <div className="text-right text-xs">
                    {a.amount_awarded_rands
                      ? <p className="font-medium text-green-700">{formatRand(a.amount_awarded_rands)} awarded</p>
                      : <p className="text-gray-500">Requested: {formatRand(a.amount_requested_rands)}</p>}
                    <p className="text-gray-400 mt-1">{formatDate(a.created_at, 'short')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
