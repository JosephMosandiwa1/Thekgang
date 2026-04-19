'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, slugify, supabaseErrorMessage } from '@/lib/utils';

interface Template {
  id?: number; slug: string; title: string; contract_type: string;
  description: string | null; body_markdown: string;
  variables: { name: string; label: string; required?: boolean }[];
  jurisdiction: string; last_reviewed: string | null; reviewed_by: string | null;
  tier_required: string; active: boolean;
}

const CONTRACT_TYPES = ['publishing', 'translation', 'illustration', 'ghostwriting', 'editorial', 'nda', 'model_release', 'photography', 'audiobook', 'film_option', 'other'];

const EMPTY: Template = { slug: '', title: '', contract_type: 'publishing', description: null, body_markdown: '', variables: [], jurisdiction: 'ZA', last_reviewed: null, reviewed_by: null, tier_required: 'affiliate', active: true };

export default function AdminContracts() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('contract_templates').select('*').order('title');
    setItems(((data || []) as unknown) as Template[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const record = { ...editing, slug: editing.slug || slugify(editing.title) };
    const { error } = editing.id ? await supabase.from('contract_templates').update(record).eq('id', editing.id) : await supabase.from('contract_templates').insert(record);
    if (error) alert(supabaseErrorMessage(error)); else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Contract templates</h1>
          <p className="text-sm text-gray-500 mt-1">Standard publishing / translation / NDA agreements for members</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New template</button>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Tier</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Last reviewed</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Active</th><th className="text-right px-4 py-3"></th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-xs">{t.contract_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs">{t.tier_required}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{t.last_reviewed ? formatDate(t.last_reviewed, 'short') : '—'}</td>
                <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.active ? 'yes' : 'no'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(t)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} template</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Type</span>
                  <select value={editing.contract_type} onChange={(e) => setEditing({ ...editing, contract_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Template body (use {'{{VAR_NAME}}'} for variables)</span><textarea rows={14} value={editing.body_markdown} onChange={(e) => setEditing({ ...editing, body_markdown: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Variables (JSON: [{'{'}&quot;name&quot;:&quot;AUTHOR_NAME&quot;,&quot;label&quot;:&quot;Author name&quot;,&quot;required&quot;:true{'}'}])</span>
                <textarea rows={5} value={JSON.stringify(editing.variables, null, 2)} onChange={(e) => {
                  try { setEditing({ ...editing, variables: JSON.parse(e.target.value) }); } catch {}
                }} className="w-full px-3 py-2 border border-gray-200 text-xs font-mono" />
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Jurisdiction</span><input value={editing.jurisdiction} onChange={(e) => setEditing({ ...editing, jurisdiction: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Last reviewed</span><input type="date" value={editing.last_reviewed || ''} onChange={(e) => setEditing({ ...editing, last_reviewed: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Tier required</span>
                  <select value={editing.tier_required} onChange={(e) => setEditing({ ...editing, tier_required: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="affiliate">Affiliate</option><option value="active">Active</option><option value="patron">Patron</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />Active</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
