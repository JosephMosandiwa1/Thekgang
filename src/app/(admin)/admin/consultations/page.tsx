'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, slugify, supabaseErrorMessage } from '@/lib/utils';
import { FeatureOnSiteButton } from '@/components/placements/FeatureOnSiteButton';

interface Consult {
  id?: number; slug: string; title: string; subject: string | null; body: string | null;
  bill_reference: string | null; opens_at: string | null; closes_at: string | null;
  status: string; response_count: number; sign_on_count: number;
  summary_published: boolean; council_position: string | null;
  council_submission_url: string | null;
}

export default function AdminConsultations() {
  const [items, setItems] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Consult | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('consultations').select('*').order('updated_at', { ascending: false });
    setItems((data || []) as Consult[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const record = { ...editing, slug: editing.slug || slugify(editing.title) };
    const { error } = editing.id ? await supabase.from('consultations').update(record).eq('id', editing.id) : await supabase.from('consultations').insert(record);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Policy consultations</h1>
          <p className="text-sm text-gray-500 mt-1">Public consultation microsites · collect sector responses · build Council submissions</p>
        </div>
        <button onClick={() => setEditing({ slug: '', title: '', subject: null, body: null, bill_reference: null, opens_at: null, closes_at: null, status: 'draft', response_count: 0, sign_on_count: 0, summary_published: false, council_position: null, council_submission_url: null })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New consultation</button>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Subject</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Responses</th><th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Sign-ons</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Closes</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-right px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{c.title}<div className="text-[10px] text-gray-400 font-mono">{c.slug}</div></td>
                <td className="px-4 py-3 text-xs">{c.subject || '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{c.response_count}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{c.sign_on_count}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{c.closes_at ? formatDate(c.closes_at, 'short') : '—'}</td>
                <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 ${c.status === 'open' ? 'bg-green-100 text-green-700' : c.status === 'responded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end items-center">
                    <Link href={`/consultations/${c.slug}`} target="_blank" className="text-xs text-gray-500 hover:text-black">Preview →</Link>
                    {c.id && <FeatureOnSiteButton contentKind="consultation" refId={c.id} contentTitle={c.title} label="Feature" className="text-xs text-gray-500 hover:text-black" />}
                    <button onClick={() => setEditing(c)} className="text-xs text-gray-500 hover:text-black">Edit</button>
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
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} consultation</h3>
            <div className="space-y-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Subject</span><input value={editing.subject || ''} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="Copyright Amendment Bill" className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Bill reference</span><input value={editing.bill_reference || ''} onChange={(e) => setEditing({ ...editing, bill_reference: e.target.value })} placeholder="B13-2024" className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Body (HTML allowed)</span><textarea rows={10} value={editing.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Opens</span><input type="datetime-local" value={editing.opens_at?.slice(0, 16) || ''} onChange={(e) => setEditing({ ...editing, opens_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Closes</span><input type="datetime-local" value={editing.closes_at?.slice(0, 16) || ''} onChange={(e) => setEditing({ ...editing, closes_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option><option value="responded">Responded</option><option value="archived">Archived</option>
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Council position</span><textarea rows={3} value={editing.council_position || ''} onChange={(e) => setEditing({ ...editing, council_position: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Council submission URL</span><input value={editing.council_submission_url || ''} onChange={(e) => setEditing({ ...editing, council_submission_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
