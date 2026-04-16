'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const statusColors: Record<string, string> = { planning: 'border-amber-500/30 text-amber-700', active: 'border-green-500/30 text-green-700', completed: 'border-blue-500/30 text-blue-600', reported: 'border-gray-300 text-gray-600', cancelled: 'border-red-500/30 text-red-600' };
const STATUSES = ['planning', 'active', 'completed', 'reported', 'cancelled'];
const PROVINCES = ['National', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape'];

interface Programme { id: number; name: string; description: string; province: string; status: string; start_date: string; budget_allocated: number; budget_spent: number }

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Programme | null>(null);
  const [form, setForm] = useState({ name: '', description: '', province: '', status: 'planning', start_date: '', budget_allocated: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('programmes').select('*').order('created_at', { ascending: false });
    setProgrammes((data || []) as Programme[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', description: '', province: '', status: 'planning', start_date: '', budget_allocated: '' });
    setShowForm(true);
  }

  function openEdit(p: Programme) {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', province: p.province || '', status: p.status, start_date: p.start_date?.split('T')[0] || '', budget_allocated: String(p.budget_allocated || '') });
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !form.name) return;
    const record = { name: form.name, description: form.description || null, province: form.province || null, status: form.status, start_date: form.start_date || null, budget_allocated: parseFloat(form.budget_allocated) || 0 };
    if (editing) {
      await supabase.from('programmes').update(record).eq('id', editing.id);
    } else {
      await supabase.from('programmes').insert(record);
    }
    setShowForm(false); setEditing(null); load();
  }

  async function handleDelete(p: Programme) {
    if (!supabase || !confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await supabase.from('programmes').delete().eq('id', p.id);
    load();
  }

  const fmt = (n: number) => `R ${(n || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
  const totalBudget = programmes.reduce((s, p) => s + (p.budget_allocated || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Programmes</h1>
          <p className="text-sm text-gray-500 mt-1">Plan, deliver, track, and report on all programmes</p>
        </div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors">+ New Programme</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Programmes</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : programmes.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Active</p><p className="text-2xl font-bold mt-1 text-green-700">{programmes.filter(p => p.status === 'active').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Budget</p><p className="text-2xl font-bold mt-1 text-black">{fmt(totalBudget)}</p></div>
      </div>

      <div className="space-y-4">
        {programmes.length === 0 ? (
          <div className="border border-gray-200/60 rounded px-6 py-12 text-center text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No programmes yet — create your first'}</div>
        ) : programmes.map(p => (
          <div key={p.id} className="border border-gray-200/60 rounded p-6 hover:border-black/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => openEdit(p)}>
                <h3 className="text-base font-semibold text-black hover:underline">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                {p.province && <p className="text-[10px] text-black mt-2">{p.province}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${statusColors[p.status] || statusColors.planning}`}>{p.status}</span>
                <button onClick={() => handleDelete(p)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
            {p.budget_allocated > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Budget: {fmt(p.budget_allocated)}</span>
                  <span className="text-black">{fmt(p.budget_spent)} spent ({p.budget_allocated > 0 ? Math.round((p.budget_spent / p.budget_allocated) * 100) : 0}%)</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: `${p.budget_allocated > 0 ? Math.min(100, (p.budget_spent / p.budget_allocated) * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Programme' : 'New Programme'}</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Programme name" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    <option value="">Province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={form.budget_allocated} onChange={e => setForm(f => ({ ...f, budget_allocated: e.target.value }))} placeholder="Budget (R)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">{editing ? 'Save Changes' : 'Create'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
