'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface StaffMember { id: string; name: string; email: string; phone: string; role: string; contract_type: string; active: boolean; start_date: string; end_date: string; monthly_salary: number; hourly_rate: number }

const CONTRACT_TYPES = ['permanent', 'fixed_term', 'consultant', 'volunteer'];

export default function HRPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', contract_type: 'consultant', start_date: '', end_date: '', monthly_salary: '', hourly_rate: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('staff').select('*').order('name');
    setStaff((data || []) as StaffMember[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ name: '', email: '', phone: '', role: '', contract_type: 'consultant', start_date: '', end_date: '', monthly_salary: '', hourly_rate: '' }); setShowForm(true); }
  function openEdit(s: StaffMember) { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', role: s.role || '', contract_type: s.contract_type, start_date: s.start_date?.split('T')[0] || '', end_date: s.end_date?.split('T')[0] || '', monthly_salary: String(s.monthly_salary || ''), hourly_rate: String(s.hourly_rate || '') }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.name) return;
    const record = { name: form.name, email: form.email || null, phone: form.phone || null, role: form.role || null, contract_type: form.contract_type, start_date: form.start_date || null, end_date: form.end_date || null, monthly_salary: parseFloat(form.monthly_salary) || null, hourly_rate: parseFloat(form.hourly_rate) || null };
    if (editing) { await supabase.from('staff').update(record).eq('id', editing.id); }
    else { await supabase.from('staff').insert({ ...record, active: true }); }
    setShowForm(false); setEditing(null); load();
  }

  async function toggleActive(s: StaffMember) { if (!supabase) return; await supabase.from('staff').update({ active: !s.active }).eq('id', s.id); load(); }
  async function handleDelete(s: StaffMember) { if (!supabase || !confirm(`Remove "${s.name}"?`)) return; await supabase.from('staff').delete().eq('id', s.id); load(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">HR &amp; Team</h1><p className="text-sm text-gray-500 mt-1">Staff register, contracts, timesheets, leave</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ Add Staff</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : staff.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Active</p><p className="text-2xl font-bold mt-1 text-green-700">{staff.filter(s => s.active).length}</p></div>
        <div className="border border-blue-500/30 bg-blue-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Consultants</p><p className="text-2xl font-bold mt-1 text-blue-600">{staff.filter(s => s.contract_type === 'consultant').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Permanent</p><p className="text-2xl font-bold mt-1 text-black">{staff.filter(s => s.contract_type === 'permanent').length}</p></div>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-2">Role</span><span className="col-span-2">Email</span><span className="col-span-1">Type</span><span className="col-span-1">Start</span><span className="col-span-1">Status</span><span className="col-span-2">Actions</span>
        </div>
        {staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No staff yet'}</div>
        ) : staff.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(s)}>{s.name}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.role || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs truncate">{s.email || '—'}</span>
            <span className="col-span-1 text-[10px] text-gray-500 capitalize">{s.contract_type?.replace('_', ' ')}</span>
            <span className="col-span-1 text-gray-500 text-xs">{s.start_date?.split('T')[0] || '—'}</span>
            <span className="col-span-1"><span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${s.active ? 'border-green-500/30 text-green-700' : 'border-gray-200 text-gray-500'}`}>{s.active ? 'Active' : 'Inactive'}</span></span>
            <span className="col-span-2 flex gap-1">
              <button onClick={() => toggleActive(s)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-amber-500/30 text-amber-700 rounded hover:bg-amber-50 transition-colors">{s.active ? 'Deactivate' : 'Activate'}</button>
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
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Staff' : 'Add Staff'}</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Role / Title" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} placeholder="End date" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.monthly_salary} onChange={e => setForm(f => ({ ...f, monthly_salary: e.target.value }))} placeholder="Monthly salary (R)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} placeholder="Hourly rate (R)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
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
