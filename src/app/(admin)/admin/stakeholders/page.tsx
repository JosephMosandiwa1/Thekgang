'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Stakeholder { id: string; name: string; stakeholder_type: string; organisation: string; email: string; province: string; relationship_status: string }

const types = ['all', 'government', 'partner', 'publisher', 'author', 'illustrator', 'printer', 'distributor', 'retailer', 'library', 'school', 'media', 'funder'];
const statusColors: Record<string, string> = { identified: 'text-gray-500', contacted: 'text-blue-600', engaged: 'text-amber-700', active: 'text-green-700', dormant: 'text-red-600' };

export default function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'author', organisation: '', email: '', province: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('stakeholders').select('*').order('name');
    setStakeholders((data || []) as Stakeholder[]);
    setLoading(false);
  }
  async function handleAdd() {
    if (!supabase || !form.name) return;
    await supabase.from('stakeholders').insert({ name: form.name, stakeholder_type: form.type, organisation: form.organisation || null, email: form.email || null, province: form.province || null });
    setShowAdd(false); setForm({ name: '', type: 'author', organisation: '', email: '', province: '' }); load();
  }

  const filtered = stakeholders.filter(s => {
    if (filter !== 'all' && s.stakeholder_type !== filter) return false;
    if (search) return s.name.toLowerCase().includes(search.toLowerCase()) || s.organisation?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Stakeholders</h1>
          <p className="text-sm text-gray-500 mt-1">Everyone in the book publishing ecosystem — CRM</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ Add Stakeholder</button>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`text-[10px] px-2.5 py-1 capitalize rounded transition-colors ${filter === t ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 border border-gray-200/60'}`}>{t}</button>
        ))}
      </div>
      <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border border-gray-200/60 px-4 py-2 text-sm rounded text-black placeholder:text-gray-500/30 focus:outline-none focus:border-black w-full max-w-sm mb-6" />

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-2">Type</span><span className="col-span-2">Organisation</span><span className="col-span-2">Province</span><span className="col-span-1">Email</span><span className="col-span-2">Relationship</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No stakeholders found'}</div>
        ) : filtered.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium">{s.name}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{s.stakeholder_type}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.organisation || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.province || '—'}</span>
            <span className="col-span-1 text-gray-500 text-xs truncate">{s.email || '—'}</span>
            <span className="col-span-2"><span className={`text-[10px] capitalize ${statusColors[s.relationship_status] || 'text-gray-500'}`}>{s.relationship_status}</span></span>
          </div>
        ))}
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">Add Stakeholder</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  {types.filter(t => t !== 'all').map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
                <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation (optional)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="Province" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleAdd} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-black-light">Add</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
