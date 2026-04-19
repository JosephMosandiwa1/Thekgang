'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface WorkingGroup { id: number; discipline: string; name: string }
interface Policy {
  id: number;
  working_group_id: number | null;
  title: string;
  subject: string | null;
  target_body: string | null;
  reference_code: string | null;
  executive_summary: string | null;
  full_text: string | null;
  status: string;
  submission_date: string | null;
}

export default function PortalPolicy() {
  const [groups, setGroups] = useState<WorkingGroup[]>([]);
  const [submissions, setSubmissions] = useState<Policy[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Policy>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const mem = m as { id: number };
      setMemberId(mem.id);
      const { data: subs } = await supabase.from('policy_submissions').select('*').eq('author_member_id', mem.id).order('created_at', { ascending: false });
      setSubmissions((subs || []) as Policy[]);
    }
    const { data: wg } = await supabase.from('working_groups').select('id, discipline, name').eq('active', true).order('name');
    setGroups((wg || []) as WorkingGroup[]);
    setLoading(false);
  }

  async function save(submit: boolean) {
    if (!supabase || !memberId) return;
    setSaving(true); setMessage(null);
    const record = {
      author_member_id: memberId,
      working_group_id: form.working_group_id || null,
      title: form.title,
      subject: form.subject || null,
      target_body: form.target_body || null,
      executive_summary: form.executive_summary || null,
      full_text: form.full_text || null,
      status: submit ? 'in_review' : 'draft',
    };
    const { error } = form.id
      ? await supabase.from('policy_submissions').update(record).eq('id', form.id)
      : await supabase.from('policy_submissions').insert(record);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setShowForm(false); setForm({}); load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Policy voice</p>
          <h1 className="font-display text-3xl font-bold">Submissions to Parliament</h1>
          <p className="text-gray-600 mt-2 max-w-2xl text-sm">
            Your working-group positions carried by the Council to Portfolio Committees and DSAC. Draft a position, route it via your working group, track its progress through to response.
          </p>
        </div>
        <button onClick={() => { setForm({}); setShowForm(true); }} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-800">
          + New submission
        </button>
      </div>

      {showForm && (
        <div className="border border-gray-200 p-5 mb-8 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span>
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Working group</span>
              <select value={form.working_group_id ?? ''} onChange={(e) => setForm({ ...form, working_group_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black">
                <option value="">—</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Subject (e.g. Copyright Amendment Bill)</span>
              <input value={form.subject ?? ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Target body</span>
              <input value={form.target_body ?? ''} onChange={(e) => setForm({ ...form, target_body: e.target.value })} placeholder="Portfolio Committee on Trade & Industry" className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
            </label>
          </div>
          <label className="block mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Executive summary</span>
            <textarea rows={3} value={form.executive_summary ?? ''} onChange={(e) => setForm({ ...form, executive_summary: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
          </label>
          <label className="block mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Full submission text</span>
            <textarea rows={8} value={form.full_text ?? ''} onChange={(e) => setForm({ ...form, full_text: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black" />
          </label>
          {message && <div className="mb-3 p-3 bg-white border border-red-300 text-red-700 text-sm">{message}</div>}
          <div className="flex gap-3">
            <button onClick={() => save(false)} disabled={saving || !form.title} className="text-xs uppercase tracking-wider border border-gray-400 px-4 py-2 hover:border-black disabled:opacity-50">Save draft</button>
            <button onClick={() => save(true)} disabled={saving || !form.title} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">Route for review</button>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-black ml-auto">Cancel</button>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="text-sm text-gray-500">No submissions yet. Use the button above to draft your first policy position.</p>
      ) : (
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {submissions.map((p) => (
            <div key={p.id} className="py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{p.status}{p.subject && ` · ${p.subject}`}</p>
                <p className="font-medium">{p.title}</p>
                {p.target_body && <p className="text-xs text-gray-500 mt-1">Target: {p.target_body}</p>}
                {p.submission_date && <p className="text-[10px] text-gray-400 mt-1">Submitted {formatDate(p.submission_date, 'short')}</p>}
              </div>
              <button onClick={() => { setForm(p); setShowForm(true); }} className="text-xs text-gray-500 hover:text-black whitespace-nowrap">Edit →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
