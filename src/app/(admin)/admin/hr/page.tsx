'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface StaffMember { id: string; name: string; email: string; role: string; contract_type: string; active: boolean; start_date: string }

export default function HRPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', contractType: 'consultant' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('staff').select('*').order('name');
    setStaff((data || []) as StaffMember[]);
    setLoading(false);
  }

  async function handleAdd() {
    if (!supabase || !form.name) return;
    await supabase.from('staff').insert({ name: form.name, email: form.email, role: form.role, contract_type: form.contractType });
    setShowAdd(false); setForm({ name: '', email: '', role: '', contractType: 'consultant' }); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">HR &amp; Team</h1>
          <p className="text-sm text-gray-500 mt-1">Staff register, contracts, timesheets, leave</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ Add Staff</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Staff', value: staff.length, color: 'text-black' },
          { label: 'Active', value: staff.filter(s => s.active).length, color: 'text-green-700' },
          { label: 'Consultants', value: staff.filter(s => s.contract_type === 'consultant').length, color: 'text-blue-600' },
        ].map(c => (
          <div key={c.label} className="border border-gray-200/60 rounded p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{loading ? '...' : c.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-3">Role</span><span className="col-span-2">Email</span>
          <span className="col-span-2">Contract</span><span className="col-span-2">Start Date</span>
        </div>
        {staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No staff registered yet'}</div>
        ) : staff.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium">{s.name}</span>
            <span className="col-span-3 text-black/60 text-xs">{s.role}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.email || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{s.contract_type}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.start_date || '—'}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">Add Staff Member</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Role / Title" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  <option value="permanent">Permanent</option><option value="fixed_term">Fixed Term</option>
                  <option value="consultant">Consultant</option><option value="volunteer">Volunteer</option>
                </select>
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
