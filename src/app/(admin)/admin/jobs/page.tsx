'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, slugify, supabaseErrorMessage } from '@/lib/utils';
import { FeatureOnSiteButton } from '@/components/placements/FeatureOnSiteButton';

interface Job {
  id?: number; slug?: string | null; title: string; employer_name: string; employer_logo_url: string | null;
  job_type: string; discipline: string | null; location: string | null; remote: boolean;
  salary_min_rands: number | null; salary_max_rands: number | null; salary_period: string;
  description: string | null; requirements: string | null; benefits: string | null;
  application_url: string | null; application_email: string | null;
  closes_at: string | null; status: string; approved: boolean; views_count?: number;
}

const STATUS = ['draft', 'open', 'closed', 'filled', 'archived'];

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Job | null>(null);
  const [filter, setFilter] = useState<'pending' | 'open' | 'all'>('pending');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    setJobs((data || []) as Job[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const record = { ...editing, slug: editing.slug || slugify(editing.title + '-' + editing.employer_name) };
    const { error } = editing.id ? await supabase.from('jobs').update(record).eq('id', editing.id) : await supabase.from('jobs').insert(record);
    if (error) alert(supabaseErrorMessage(error)); else { setEditing(null); load(); }
  }

  async function approve(j: Job, approved: boolean) {
    if (!supabase) return;
    await supabase.from('jobs').update({ approved, status: approved ? 'open' : 'draft' }).eq('id', j.id);
    load();
  }

  const filtered = jobs.filter((j) => {
    if (filter === 'pending') return !j.approved;
    if (filter === 'open') return j.status === 'open' && j.approved;
    return true;
  });

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Job board</h1>
          <p className="text-sm text-gray-500 mt-1">Approve and manage sector job postings</p>
        </div>
        <button onClick={() => setEditing({ title: '', employer_name: '', employer_logo_url: null, job_type: 'full_time', discipline: null, location: null, remote: false, salary_min_rands: null, salary_max_rands: null, salary_period: 'month', description: null, requirements: null, benefits: null, application_url: null, application_email: null, closes_at: null, status: 'open', approved: true })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Post job</button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['pending', 'open', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${filter === f ? 'bg-black text-white border-black' : 'border-gray-300'}`}>{f} ({f === 'pending' ? jobs.filter((j) => !j.approved).length : f === 'open' ? jobs.filter((j) => j.status === 'open' && j.approved).length : jobs.length})</button>
        ))}
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Employer</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Location</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-right px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr key={j.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{j.title}</td>
                <td className="px-4 py-3 text-xs">{j.employer_name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{j.job_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{j.location}{j.remote && ' (remote)'}</td>
                <td className="px-4 py-3">
                  {!j.approved ? <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-2 py-0.5">pending</span>
                    : <span className={`text-[10px] uppercase px-2 py-0.5 ${j.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{j.status}</span>}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <div className="flex gap-2 justify-end items-center">
                    {!j.approved && <button onClick={() => approve(j, true)} className="text-green-700 hover:underline">Approve</button>}
                    {j.id && <FeatureOnSiteButton contentKind="job" refId={j.id} contentTitle={j.title} label="Feature" className="text-xs text-gray-500 hover:text-black" />}
                    <button onClick={() => setEditing(j)} className="text-gray-500 hover:text-black">Edit →</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'Post'} job</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Employer *</span><input value={editing.employer_name} onChange={(e) => setEditing({ ...editing, employer_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Type</span>
                  <select value={editing.job_type} onChange={(e) => setEditing({ ...editing, job_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {['full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Discipline</span><input value={editing.discipline || ''} onChange={(e) => setEditing({ ...editing, discipline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Location</span><input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Closes</span><input type="date" value={editing.closes_at || ''} onChange={(e) => setEditing({ ...editing, closes_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Salary min</span><input type="number" value={editing.salary_min_rands ?? ''} onChange={(e) => setEditing({ ...editing, salary_min_rands: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Salary max</span><input type="number" value={editing.salary_max_rands ?? ''} onChange={(e) => setEditing({ ...editing, salary_max_rands: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Period</span>
                  <select value={editing.salary_period} onChange={(e) => setEditing({ ...editing, salary_period: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {['hour', 'day', 'week', 'month', 'year', 'project'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={4} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Requirements</span><textarea rows={3} value={editing.requirements || ''} onChange={(e) => setEditing({ ...editing, requirements: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Apply URL</span><input value={editing.application_url || ''} onChange={(e) => setEditing({ ...editing, application_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Apply email</span><input value={editing.application_email || ''} onChange={(e) => setEditing({ ...editing, application_email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.remote} onChange={(e) => setEditing({ ...editing, remote: e.target.checked })} />Remote</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.approved} onChange={(e) => setEditing({ ...editing, approved: e.target.checked })} />Approved</label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="px-3 py-1 border border-gray-200 text-sm">{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
