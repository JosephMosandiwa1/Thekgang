'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface Period {
  id: number;
  year: number;
  period_label: string;
  open_date: string;
  close_date: string;
  status: string;
}

interface Submission {
  id: number;
  period_id: number;
  discipline: string;
  organisation: string | null;
  titles_published: number | null;
  copies_sold: number | null;
  revenue_rands: number | null;
  employees_fte: number | null;
  freelancers_count: number | null;
  export_revenue_rands: number | null;
  translations_count: number | null;
  digital_titles_count: number | null;
  audio_titles_count: number | null;
  growth_notes: string | null;
  challenges_notes: string | null;
  policy_priorities: string | null;
  status: string;
  submitted_at: string | null;
}

export default function PortalSectorData() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberDiscipline, setMemberDiscipline] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Submission>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id, disciplines').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const member = m as { id: number; disciplines: string[] };
      setMemberId(member.id);
      setMemberDiscipline(member.disciplines[0] || 'Author');
      const { data: subs } = await supabase.from('sector_data_submissions').select('*').eq('member_id', member.id).order('created_at', { ascending: false });
      setSubmissions((subs || []) as Submission[]);
    }
    const { data: p } = await supabase.from('sector_data_periods').select('*').in('status', ['open', 'closing']).order('close_date');
    setPeriods((p || []) as Period[]);
    setLoading(false);
  }

  function openForm(periodId: number, existing?: Submission) {
    setActivePeriod(periodId);
    setForm(existing || { discipline: memberDiscipline });
    setMessage(null);
  }

  async function save(submit: boolean) {
    if (!supabase || !memberId || !activePeriod) return;
    setSaving(true); setMessage(null);
    const record = {
      period_id: activePeriod,
      member_id: memberId,
      discipline: form.discipline || memberDiscipline,
      organisation: form.organisation || null,
      titles_published: form.titles_published ?? null,
      copies_sold: form.copies_sold ?? null,
      revenue_rands: form.revenue_rands ?? null,
      employees_fte: form.employees_fte ?? null,
      freelancers_count: form.freelancers_count ?? null,
      export_revenue_rands: form.export_revenue_rands ?? null,
      translations_count: form.translations_count ?? null,
      digital_titles_count: form.digital_titles_count ?? null,
      audio_titles_count: form.audio_titles_count ?? null,
      growth_notes: form.growth_notes || null,
      challenges_notes: form.challenges_notes || null,
      policy_priorities: form.policy_priorities || null,
      status: submit ? 'submitted' : 'draft',
      submitted_at: submit ? new Date().toISOString() : null,
    };
    const { error } = form.id
      ? await supabase.from('sector_data_submissions').update(record).eq('id', form.id)
      : await supabase.from('sector_data_submissions').insert(record);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setMessage(submit ? 'Submitted — thank you.' : 'Draft saved.'); setActivePeriod(null); await load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Sector data</p>
      <h1 className="font-display text-3xl font-bold mb-2">Annual sector submission</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        Every year the Council collects sector data from every discipline to produce the annual State of the Publishing Sector report. Your submission is confidential — published only as aggregated totals.
      </p>

      {periods.length === 0 ? (
        <p className="text-sm text-gray-500">No open submission period at the moment. You&apos;ll be notified when the next window opens.</p>
      ) : (
        <div className="space-y-6">
          {periods.map((p) => {
            const existing = submissions.find((s) => s.period_id === p.id);
            const isOpen = activePeriod === p.id;
            return (
              <div key={p.id} className="border border-gray-200">
                <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{p.status}</p>
                    <h2 className="font-display text-lg font-bold">{p.period_label}</h2>
                    <p className="text-xs text-gray-500 mt-1">Closes {formatDate(p.close_date, 'long')}</p>
                  </div>
                  <div className="text-right">
                    {existing ? (
                      <>
                        <p className="text-xs text-gray-500 mb-2">{existing.status}</p>
                        <button onClick={() => openForm(p.id, existing)} className="text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                          {existing.status === 'draft' ? 'Continue draft' : 'View / edit'}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => openForm(p.id)} className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2 hover:bg-gray-800">
                        Start submission
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-200 p-5 bg-gray-50">
                    <SectorForm form={form} setForm={setForm} />
                    {message && <div className="mt-4 p-3 bg-white border border-gray-200 text-sm">{message}</div>}
                    <div className="mt-5 flex gap-3">
                      <button onClick={() => save(false)} disabled={saving} className="text-xs uppercase tracking-wider border border-gray-400 px-4 py-2 hover:border-black hover:text-black disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save draft'}
                      </button>
                      <button onClick={() => save(true)} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">
                        Submit
                      </button>
                      <button onClick={() => setActivePeriod(null)} className="text-xs text-gray-500 hover:text-black ml-auto">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {submissions.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-lg font-bold mb-4">Your submission history</h3>
          <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {submissions.map((s) => {
              const period = periods.find((p) => p.id === s.period_id);
              return (
                <li key={s.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{period?.period_label || `Period #${s.period_id}`}</p>
                    <p className="text-xs text-gray-500">{s.discipline} · {s.status} {s.submitted_at && `· submitted ${formatDate(s.submitted_at, 'short')}`}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-10 text-xs text-gray-400">
        Questions about the sector survey? <Link href="/contact" className="underline">Get in touch →</Link>
      </p>
    </div>
  );
}

function SectorForm({ form, setForm }: { form: Partial<Submission>; setForm: (f: Partial<Submission>) => void }) {
  function setNum(field: keyof Submission, v: string) {
    const n = v === '' ? null : parseFloat(v);
    setForm({ ...form, [field]: isNaN(n as number) ? null : n });
  }
  const nInput = (key: keyof Submission, label: string) => (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">{label}</span>
      <input
        type="number"
        value={form[key] == null ? '' : String(form[key])}
        onChange={(e) => setNum(key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black"
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Organisation (if applicable)</span>
          <input value={form.organisation ?? ''} onChange={(e) => setForm({ ...form, organisation: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Your discipline</span>
          <input value={form.discipline ?? ''} onChange={(e) => setForm({ ...form, discipline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
        </label>
      </div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mt-4">Volume</p>
      <div className="grid md:grid-cols-3 gap-3">
        {nInput('titles_published', 'Titles published')}
        {nInput('copies_sold', 'Copies sold')}
        {nInput('digital_titles_count', 'Digital titles')}
        {nInput('audio_titles_count', 'Audio titles')}
        {nInput('translations_count', 'Translations')}
      </div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mt-4">Revenue (ZAR)</p>
      <div className="grid md:grid-cols-2 gap-3">
        {nInput('revenue_rands', 'Total revenue')}
        {nInput('export_revenue_rands', 'Export revenue')}
      </div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mt-4">Employment</p>
      <div className="grid md:grid-cols-2 gap-3">
        {nInput('employees_fte', 'Full-time equivalents')}
        {nInput('freelancers_count', 'Freelancers engaged')}
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Growth notes (optional)</span>
        <textarea rows={3} value={form.growth_notes ?? ''} onChange={(e) => setForm({ ...form, growth_notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Challenges (optional)</span>
        <textarea rows={3} value={form.challenges_notes ?? ''} onChange={(e) => setForm({ ...form, challenges_notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Policy priorities (optional)</span>
        <textarea rows={3} value={form.policy_priorities ?? ''} onChange={(e) => setForm({ ...form, policy_priorities: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
      </label>
    </div>
  );
}
