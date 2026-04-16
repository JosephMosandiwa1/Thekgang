'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Report { id: number; report_type: string; period: string; narrative: string; budget_spent: number; challenges: string; recommendations: string; submitted: boolean; submitted_at: string; programmes?: { name: string }; programme_id: number }
interface Programme { id: number; name: string }

const REPORT_TYPES = ['quarterly', 'annual', 'completion'];
const PERIODS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027'];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [form, setForm] = useState({ programme_id: '', report_type: 'quarterly', period: '', narrative: '', budget_spent: '', challenges: '', recommendations: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [rep, prog] = await Promise.all([
      supabase.from('programme_reports').select('*, programmes(name)').order('created_at', { ascending: false }),
      supabase.from('programmes').select('id, name').order('name'),
    ]);
    setReports((rep.data || []) as Report[]);
    setProgrammes((prog.data || []) as Programme[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ programme_id: '', report_type: 'quarterly', period: '', narrative: '', budget_spent: '', challenges: '', recommendations: '' }); setShowForm(true); }
  function openEdit(r: Report) { setEditing(r); setForm({ programme_id: String(r.programme_id || ''), report_type: r.report_type, period: r.period || '', narrative: r.narrative || '', budget_spent: String(r.budget_spent || ''), challenges: r.challenges || '', recommendations: r.recommendations || '' }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.programme_id || !form.period) return;
    const record = { programme_id: parseInt(form.programme_id), report_type: form.report_type, period: form.period, narrative: form.narrative || null, budget_spent: parseFloat(form.budget_spent) || null, challenges: form.challenges || null, recommendations: form.recommendations || null };
    if (editing) { await supabase.from('programme_reports').update(record).eq('id', editing.id); }
    else { await supabase.from('programme_reports').insert({ ...record, submitted: false }); }
    setShowForm(false); setEditing(null); load();
  }

  async function toggleSubmit(r: Report) {
    if (!supabase) return;
    await supabase.from('programme_reports').update({ submitted: !r.submitted, submitted_at: !r.submitted ? new Date().toISOString() : null }).eq('id', r.id);
    load();
  }

  async function handleDelete(r: Report) {
    if (!supabase || !confirm('Delete this report?')) return;
    await supabase.from('programme_reports').delete().eq('id', r.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">DSAC Reports</h1><p className="text-sm text-gray-500 mt-1">Quarterly narrative + financial reports for DSAC compliance</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ New Report</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Reports</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : reports.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Submitted</p><p className="text-2xl font-bold mt-1 text-green-700">{reports.filter(r => r.submitted).length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Drafts</p><p className="text-2xl font-bold mt-1 text-amber-700">{reports.filter(r => !r.submitted).length}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 border border-gray-200/60 rounded p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">Reporting Schedule</h3>
          <div className="space-y-3">
            {[
              { period: 'Q1 (Apr-Jun 2026)', due: '31 Jul 2026' },
              { period: 'Q2 (Jul-Sep 2026)', due: '31 Oct 2026' },
              { period: 'Q3 (Oct-Dec 2026)', due: '31 Jan 2027' },
              { period: 'Q4 (Jan-Mar 2027)', due: '30 Apr 2027' },
            ].map(r => {
              const submitted = reports.some(rep => rep.period?.includes(r.period.split(' ')[0]) && rep.submitted);
              return (
                <div key={r.period} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-black">{r.period}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Due: {r.due}</span>
                    {submitted && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-green-500/30 text-green-700 rounded">Done</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 border border-gray-200/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
            <span className="col-span-3">Programme</span><span className="col-span-2">Type</span><span className="col-span-2">Period</span><span className="col-span-1">Status</span><span className="col-span-4">Actions</span>
          </div>
          {reports.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No reports yet'}</div>
          ) : reports.map(r => (
            <div key={r.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
              <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(r)}>{(r as any).programmes?.name || '—'}</span>
              <span className="col-span-2 text-gray-500 text-xs capitalize">{r.report_type}</span>
              <span className="col-span-2 text-gray-500 text-xs">{r.period || '—'}</span>
              <span className="col-span-1"><span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${r.submitted ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'}`}>{r.submitted ? 'Sent' : 'Draft'}</span></span>
              <span className="col-span-4 flex gap-1">
                <button onClick={() => openEdit(r)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50">Edit</button>
                <button onClick={() => toggleSubmit(r)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${r.submitted ? 'border-amber-500/30 text-amber-700 hover:bg-amber-50' : 'border-green-500/30 text-green-700 hover:bg-green-50'}`}>{r.submitted ? 'Unsubmit' : 'Submit'}</button>
                <button onClick={() => handleDelete(r)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Report' : 'New DSAC Report'}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.programme_id} onChange={e => setForm(f => ({ ...f, programme_id: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    <option value="">Select programme *</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    <option value="">Period *</option>
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} placeholder="Narrative report — what was achieved, activities completed, outcomes" rows={6} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <input value={form.budget_spent} onChange={e => setForm(f => ({ ...f, budget_spent: e.target.value }))} placeholder="Budget spent this period (R)" type="number" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <textarea value={form.challenges} onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))} placeholder="Challenges encountered" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} placeholder="Recommendations" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">{editing ? 'Save Changes' : 'Create Report'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
