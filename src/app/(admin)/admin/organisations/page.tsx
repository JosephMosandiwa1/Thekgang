'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { slugify, supabaseErrorMessage, SA_PROVINCES, CDCC_DISCIPLINES } from '@/lib/utils';

interface Org {
  id?: number;
  slug?: string | null;
  name: string;
  legal_name: string | null;
  org_type: string;
  description: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  logo_url: string | null;
  year_founded: number | null;
  disciplines: string[];
  cipc_number: string | null;
  bbbee_level: number | null;
  is_member: boolean;
  public: boolean;
  verified: boolean;
  created_at?: string;
}

const ORG_TYPES = ['publisher', 'imprint', 'bookseller', 'distributor', 'printer', 'design_studio', 'literary_agency', 'press', 'library', 'academic', 'association', 'other'];

export default function AdminOrganisations() {
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Org | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('organisations').select('*').order('name');
    setRows((data || []) as Org[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const record = { ...editing, slug: editing.slug || slugify(editing.name) };
    const { error } = editing.id
      ? await supabase.from('organisations').update(record).eq('id', editing.id)
      : await supabase.from('organisations').insert(record);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  const filtered = rows.filter((r) => !q.trim() || r.name.toLowerCase().includes(q.toLowerCase()) || (r.city || '').toLowerCase().includes(q.toLowerCase()));

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Organisations</h1>
          <p className="text-sm text-gray-500 mt-1">Publishers, booksellers, distributors, libraries, studios</p>
        </div>
        <button onClick={() => setEditing({ name: '', legal_name: null, org_type: 'publisher', description: null, website_url: null, email: null, phone: null, city: null, province: null, logo_url: null, year_founded: null, disciplines: [], cipc_number: null, bbbee_level: null, is_member: false, public: true, verified: false })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Add organisation</button>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full md:max-w-md px-3 py-2 border border-gray-200 text-sm mb-4" />

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">City</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{r.name}{r.legal_name && <div className="text-[10px] text-gray-400">{r.legal_name}</div>}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.org_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs">{[r.city, r.province].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {r.public && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 uppercase">public</span>}
                    {r.verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 uppercase">verified</span>}
                    {r.is_member && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 uppercase">member</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(r)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No organisations.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} organisation</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Name *</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Legal name</span><input value={editing.legal_name || ''} onChange={(e) => setEditing({ ...editing, legal_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Type</span>
                  <select value={editing.org_type} onChange={(e) => setEditing({ ...editing, org_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Year founded</span><input type="number" value={editing.year_founded ?? ''} onChange={(e) => setEditing({ ...editing, year_founded: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">B-BBEE level</span><input type="number" min={1} max={8} value={editing.bbbee_level ?? ''} onChange={(e) => setEditing({ ...editing, bbbee_level: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span><textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Website</span><input value={editing.website_url || ''} onChange={(e) => setEditing({ ...editing, website_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email</span><input value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">City</span><input value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Province</span>
                  <select value={editing.province || ''} onChange={(e) => setEditing({ ...editing, province: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="">—</option>
                    {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Disciplines active</span>
                <div className="flex flex-wrap gap-1.5">
                  {CDCC_DISCIPLINES.map((d) => (
                    <button type="button" key={d} onClick={() => setEditing({ ...editing, disciplines: editing.disciplines.includes(d) ? editing.disciplines.filter((x) => x !== d) : [...editing.disciplines, d] })} className={`px-2 py-1 text-xs border ${editing.disciplines.includes(d) ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.public} onChange={(e) => setEditing({ ...editing, public: e.target.checked })} />Public</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.verified} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} />Verified</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_member} onChange={(e) => setEditing({ ...editing, is_member: e.target.checked })} />Is member</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button>
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
