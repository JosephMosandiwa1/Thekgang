'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Interaction { id: string; stakeholder_id: string; interaction_type: string; date: string; summary: string; follow_up: string; follow_up_date: string; completed: boolean; stakeholders?: { name: string } }
interface Stakeholder { id: string; name: string }

const TYPES = ['meeting', 'call', 'email', 'whatsapp', 'event', 'note'];
const typeIcons: Record<string, string> = { meeting: 'M', call: 'C', email: 'E', whatsapp: 'W', event: 'V', note: 'N' };

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Interaction | null>(null);
  const [form, setForm] = useState({ stakeholder_id: '', interaction_type: 'meeting', date: '', summary: '', follow_up: '', follow_up_date: '', completed: false });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [intRes, stRes] = await Promise.all([
      supabase.from('interactions').select('*, stakeholders(name)').order('date', { ascending: false }).limit(50),
      supabase.from('stakeholders').select('id, name').order('name'),
    ]);
    setInteractions((intRes.data || []) as Interaction[]);
    setStakeholders((stRes.data || []) as Stakeholder[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ stakeholder_id: '', interaction_type: 'meeting', date: new Date().toISOString().split('T')[0], summary: '', follow_up: '', follow_up_date: '', completed: false }); setShowForm(true); }
  function openEdit(i: Interaction) { setEditing(i); setForm({ stakeholder_id: i.stakeholder_id || '', interaction_type: i.interaction_type, date: i.date?.split('T')[0] || '', summary: i.summary || '', follow_up: i.follow_up || '', follow_up_date: i.follow_up_date || '', completed: i.completed }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.summary) return;
    const record = { stakeholder_id: form.stakeholder_id || null, interaction_type: form.interaction_type, date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(), summary: form.summary, follow_up: form.follow_up || null, follow_up_date: form.follow_up_date || null, completed: form.completed };
    if (editing) { await supabase.from('interactions').update(record).eq('id', editing.id); }
    else { await supabase.from('interactions').insert(record); }
    setShowForm(false); setEditing(null); load();
  }

  async function toggleComplete(i: Interaction) { if (!supabase) return; await supabase.from('interactions').update({ completed: !i.completed }).eq('id', i.id); load(); }
  async function handleDelete(i: Interaction) { if (!supabase || !confirm('Delete this interaction?')) return; await supabase.from('interactions').delete().eq('id', i.id); load(); }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">Interactions</h1><p className="text-sm text-gray-500 mt-1">Meeting notes, calls, emails — stakeholder engagement log</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ Log Interaction</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : interactions.length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Pending Follow-ups</p><p className="text-2xl font-bold mt-1 text-amber-700">{interactions.filter(i => i.follow_up && !i.completed).length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Completed</p><p className="text-2xl font-bold mt-1 text-green-700">{interactions.filter(i => i.completed).length}</p></div>
      </div>

      <div className="border border-gray-200/60 rounded">
        {interactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No interactions logged'}</div>
        ) : interactions.map(i => (
          <div key={i.id} className="flex items-start gap-4 px-6 py-4 border-b border-gray-200/30 last:border-0 hover:bg-gray-50/50 transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{typeIcons[i.interaction_type] || 'N'}</div>
            <div className="flex-1 cursor-pointer" onClick={() => openEdit(i)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500">{i.date?.split('T')[0]}</span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-500 rounded">{i.interaction_type}</span>
                {(i as any).stakeholders?.name && <span className="text-xs text-black font-medium">{(i as any).stakeholders.name}</span>}
              </div>
              <p className="text-sm text-black">{i.summary}</p>
              {i.follow_up && <p className="text-xs text-amber-700 mt-1">Follow-up: {i.follow_up}{i.follow_up_date ? ` (by ${i.follow_up_date})` : ''}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleComplete(i)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded ${i.completed ? 'border-green-500/30 text-green-700 bg-green-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{i.completed ? '✓' : 'Done'}</button>
              <button onClick={() => handleDelete(i)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">×</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (<>
        <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit' : 'Log'} Interaction</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select value={form.stakeholder_id} onChange={e => setForm(f => ({ ...f, stakeholder_id: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"><option value="">Stakeholder</option>{stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Summary *" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              <input value={form.follow_up} onChange={e => setForm(f => ({ ...f, follow_up: e.target.value }))} placeholder="Follow-up action" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <label className="flex items-center gap-3"><input type="checkbox" checked={form.completed} onChange={e => setForm(f => ({ ...f, completed: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Completed</span></label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}
