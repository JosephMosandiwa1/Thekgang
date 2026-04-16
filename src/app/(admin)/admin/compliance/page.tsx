'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const statusColors: Record<string, string> = { upcoming: 'border-blue-500/30 text-blue-600', in_progress: 'border-amber-500/30 text-amber-700', completed: 'border-green-500/30 text-green-700', overdue: 'border-red-500/30 text-red-600' };
const CATEGORIES = ['cipc', 'dsac', 'sars', 'audit', 'governance'];

interface ComplianceItem { id: number; title: string; description: string; due_date: string; responsible: string; status: string; category: string; recurring: boolean; recurrence_months: number; completed_at: string; file_url: string; notes: string }

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ComplianceItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', responsible: '', category: 'dsac', recurring: false, recurrence_months: '', notes: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('compliance_items').select('*').order('due_date');
    setItems((data || []) as ComplianceItem[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ title: '', description: '', due_date: '', responsible: '', category: 'dsac', recurring: false, recurrence_months: '', notes: '' }); setShowForm(true); }
  function openEdit(i: ComplianceItem) { setEditing(i); setForm({ title: i.title, description: i.description || '', due_date: i.due_date?.split('T')[0] || '', responsible: i.responsible || '', category: i.category || 'dsac', recurring: i.recurring || false, recurrence_months: String(i.recurrence_months || ''), notes: i.notes || '' }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.title) return;
    const record = { title: form.title, description: form.description || null, due_date: form.due_date || null, responsible: form.responsible || null, category: form.category, recurring: form.recurring, recurrence_months: parseInt(form.recurrence_months) || null, notes: form.notes || null };
    if (editing) { await supabase.from('compliance_items').update(record).eq('id', editing.id); }
    else { await supabase.from('compliance_items').insert({ ...record, status: 'upcoming' }); }
    setShowForm(false); setEditing(null); load();
  }

  async function markComplete(i: ComplianceItem) {
    if (!supabase) return;
    await supabase.from('compliance_items').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', i.id);
    load();
  }

  async function handleDelete(i: ComplianceItem) {
    if (!supabase || !confirm(`Delete "${i.title}"?`)) return;
    await supabase.from('compliance_items').delete().eq('id', i.id);
    load();
  }

  const overdue = items.filter(i => i.status !== 'completed' && new Date(i.due_date) < new Date()).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">Compliance</h1><p className="text-sm text-gray-500 mt-1">CIPC filings, DSAC reports, audits, governance obligations</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ Add Item</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : items.length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Pending</p><p className="text-2xl font-bold mt-1 text-amber-700">{items.filter(i => i.status !== 'completed').length}</p></div>
        <div className={`border rounded p-4 ${overdue > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Overdue</p><p className={`text-2xl font-bold mt-1 ${overdue > 0 ? 'text-red-600' : 'text-green-700'}`}>{overdue}</p></div>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Obligation</span><span className="col-span-2">Category</span><span className="col-span-2">Due Date</span><span className="col-span-2">Responsible</span><span className="col-span-1">Status</span><span className="col-span-2">Actions</span>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No compliance items'}</div>
        ) : items.map(i => {
          const isOverdue = i.status !== 'completed' && new Date(i.due_date) < new Date();
          const status = isOverdue ? 'overdue' : i.status;
          return (
            <div key={i.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
              <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(i)}>{i.title}{i.recurring && <span className="ml-1 text-[9px] text-gray-400">↻</span>}</span>
              <span className="col-span-2 text-gray-500 text-xs uppercase">{i.category}</span>
              <span className={`col-span-2 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{i.due_date}</span>
              <span className="col-span-2 text-gray-500 text-xs">{i.responsible}</span>
              <span className="col-span-1"><span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${statusColors[status] || statusColors.upcoming}`}>{status.replace('_', ' ')}</span></span>
              <span className="col-span-2 flex gap-1">
                {i.status !== 'completed' && <button onClick={() => markComplete(i)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-green-500/30 text-green-700 rounded hover:bg-green-50 transition-colors">Done</button>}
                <button onClick={() => handleDelete(i)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
              </span>
            </div>
          );
        })}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Item' : 'Add Compliance Item'}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Obligation title *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
                <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Responsible person" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <label className="flex items-center gap-3"><input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Recurring obligation</span></label>
                {form.recurring && <input value={form.recurrence_months} onChange={e => setForm(f => ({ ...f, recurrence_months: e.target.value }))} placeholder="Recurrence (months)" type="number" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />}
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
