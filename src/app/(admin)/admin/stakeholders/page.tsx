'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Stakeholder { id: string; name: string; stakeholder_type: string; organisation: string; email: string; phone: string; province: string; relationship_status: string; website: string; notes: string }

const TYPES = ['all', 'government', 'partner', 'publisher', 'author', 'illustrator', 'translator', 'editor', 'designer', 'photographer', 'printer', 'distributor', 'retailer', 'library', 'school', 'media', 'funder', 'other'];
const STATUSES = ['identified', 'contacted', 'engaged', 'active', 'dormant'];
const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape'];
const statusColors: Record<string, string> = { identified: 'text-gray-500', contacted: 'text-blue-600', engaged: 'text-amber-700', active: 'text-green-700', dormant: 'text-red-600' };

export default function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);
  const [form, setForm] = useState({ name: '', type: 'author', organisation: '', email: '', phone: '', province: '', website: '', relationship_status: 'identified', notes: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('stakeholders').select('*').order('name');
    setStakeholders((data || []) as Stakeholder[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ name: '', type: 'author', organisation: '', email: '', phone: '', province: '', website: '', relationship_status: 'identified', notes: '' }); setShowForm(true); }
  function openEdit(s: Stakeholder) { setEditing(s); setForm({ name: s.name, type: s.stakeholder_type, organisation: s.organisation || '', email: s.email || '', phone: s.phone || '', province: s.province || '', website: s.website || '', relationship_status: s.relationship_status || 'identified', notes: s.notes || '' }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.name) return;
    const record = { name: form.name, stakeholder_type: form.type, organisation: form.organisation || null, email: form.email || null, phone: form.phone || null, province: form.province || null, website: form.website || null, relationship_status: form.relationship_status, notes: form.notes || null };
    if (editing) { await supabase.from('stakeholders').update(record).eq('id', editing.id); }
    else { await supabase.from('stakeholders').insert(record); }
    setShowForm(false); setEditing(null); load();
  }

  async function handleDelete(s: Stakeholder) { if (!supabase || !confirm(`Delete "${s.name}"?`)) return; await supabase.from('stakeholders').delete().eq('id', s.id); load(); }

  const filtered = stakeholders.filter(s => {
    if (filter !== 'all' && s.stakeholder_type !== filter) return false;
    if (search) return s.name.toLowerCase().includes(search.toLowerCase()) || s.organisation?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">Stakeholders</h1><p className="text-sm text-gray-500 mt-1">CRM — everyone in the content creation ecosystem</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ Add Stakeholder</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : stakeholders.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Active</p><p className="text-2xl font-bold mt-1 text-green-700">{stakeholders.filter(s => s.relationship_status === 'active').length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Engaged</p><p className="text-2xl font-bold mt-1 text-amber-700">{stakeholders.filter(s => s.relationship_status === 'engaged').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Identified</p><p className="text-2xl font-bold mt-1 text-black">{stakeholders.filter(s => s.relationship_status === 'identified').length}</p></div>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`text-[10px] px-2.5 py-1 capitalize rounded transition-colors ${filter === t ? 'bg-black text-white' : 'text-gray-500 border border-gray-200/60 hover:text-black'}`}>{t}</button>
        ))}
      </div>
      <input type="text" placeholder="Search by name or organisation..." value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-200/60 px-4 py-2 text-sm rounded focus:outline-none focus:border-black w-full max-w-sm mb-6" />

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-2">Type</span><span className="col-span-2">Organisation</span><span className="col-span-1">Province</span><span className="col-span-1">Status</span><span className="col-span-3">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No stakeholders found'}</div>
        ) : filtered.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(s)}>{s.name}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{s.stakeholder_type}</span>
            <span className="col-span-2 text-gray-500 text-xs truncate">{s.organisation || '—'}</span>
            <span className="col-span-1 text-gray-500 text-xs">{s.province || '—'}</span>
            <span className="col-span-1"><span className={`text-[10px] capitalize ${statusColors[s.relationship_status] || 'text-gray-500'}`}>{s.relationship_status}</span></span>
            <span className="col-span-3 flex gap-1">
              <button onClick={() => openEdit(s)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors">Edit</button>
              <button onClick={() => handleDelete(s)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
            </span>
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Stakeholder' : 'Add Stakeholder'}</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {TYPES.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={form.relationship_status} onChange={e => setForm(f => ({ ...f, relationship_status: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    <option value="">Province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="Website" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
