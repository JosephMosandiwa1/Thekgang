'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Submission { id: string; name: string; email: string; phone: string; province: string; constituency_type: string; organisation: string; languages: string[]; specialisation: string; bio: string; status: string; notes: string; created_at: string; utm_source: string }

const TYPES = ['all', 'author_writer', 'translator', 'designer', 'narrator', 'publisher_self_publisher', 'research_development', 'editor', 'indexer', 'proofreader', 'legal_ip', 'layout_designer', 'literary_agent', 'photographer', 'ai_software', 'other'];
const STATUSES = ['new', 'reviewed', 'verified', 'contacted'];
const statusColors: Record<string, string> = { new: 'border-blue-500/30 text-blue-600', reviewed: 'border-amber-500/30 text-amber-700', verified: 'border-green-500/30 text-green-700', contacted: 'border-gray-300 text-gray-600' };

export default function RegistryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('new');

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('constituency_submissions').select('*').order('created_at', { ascending: false });
    setSubmissions((data || []) as Submission[]);
    setLoading(false);
  }

  function openDetail(s: Submission) { setEditing(s); setEditStatus(s.status || 'new'); setEditNotes(s.notes || ''); setShowDetail(true); }

  async function saveStatus() {
    if (!supabase || !editing) return;
    await supabase.from('constituency_submissions').update({ status: editStatus, notes: editNotes || null }).eq('id', editing.id);
    setShowDetail(false); setEditing(null); load();
  }

  async function handleDelete(s: Submission) {
    if (!supabase || !confirm(`Delete submission from "${s.name}"?`)) return;
    await supabase.from('constituency_submissions').delete().eq('id', s.id);
    load();
  }

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.constituency_type !== filter) return false;
    if (search) return s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.organisation?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const pending = submissions.filter(s => s.status === 'new' || !s.status).length;
  const verified = submissions.filter(s => s.status === 'verified').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-black">Constituency Registry</h1>
        <p className="text-sm text-gray-500 mt-1">All practitioners who&apos;ve joined the CDCC council</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : submissions.length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Pending Review</p><p className="text-2xl font-bold mt-1 text-amber-700">{pending}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Verified</p><p className="text-2xl font-bold mt-1 text-green-700">{verified}</p></div>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {TYPES.map(t => {
          const count = t === 'all' ? submissions.length : submissions.filter(s => s.constituency_type === t).length;
          return <button key={t} onClick={() => setFilter(t)} className={`text-[10px] px-2.5 py-1 rounded transition-colors ${filter === t ? 'bg-black text-white' : 'text-gray-500 border border-gray-200/60 hover:text-black'}`}>{t === 'all' ? 'All' : t.replace(/_/g, ' ')} ({count})</button>;
        })}
      </div>
      <input type="text" placeholder="Search by name, email, or organisation..." value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-200/60 px-4 py-2 text-sm rounded focus:outline-none focus:border-black w-full max-w-sm mb-6" />

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-2">Type</span><span className="col-span-2">Province</span><span className="col-span-2">Email</span><span className="col-span-1">Status</span><span className="col-span-2">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No submissions found'}</div>
        ) : filtered.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openDetail(s)}>{s.name}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{s.constituency_type?.replace(/_/g, ' ')}</span>
            <span className="col-span-2 text-gray-500 text-xs">{s.province || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs truncate">{s.email}</span>
            <span className="col-span-1"><span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${statusColors[s.status] || statusColors.new}`}>{s.status || 'new'}</span></span>
            <span className="col-span-2 flex gap-1">
              <button onClick={() => openDetail(s)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50">View</button>
              <button onClick={() => handleDelete(s)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button>
            </span>
          </div>
        ))}
      </div>

      {/* Detail / Status Modal */}
      {showDetail && editing && (<>
        <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowDetail(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-display font-bold text-black mb-4">{editing.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] text-gray-400 uppercase">Email</p><p className="text-black">{editing.email}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Phone</p><p className="text-black">{editing.phone || '—'}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Province</p><p className="text-black">{editing.province || '—'}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Type</p><p className="text-black capitalize">{editing.constituency_type?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Organisation</p><p className="text-black">{editing.organisation || '—'}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase">Specialisation</p><p className="text-black">{editing.specialisation || '—'}</p></div>
              </div>
              {editing.languages && editing.languages.length > 0 && (
                <div><p className="text-[10px] text-gray-400 uppercase mb-1">Languages</p><div className="flex flex-wrap gap-1">{editing.languages.map(l => <span key={l} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded">{l}</span>)}</div></div>
              )}
              {editing.bio && <div><p className="text-[10px] text-gray-400 uppercase mb-1">Bio</p><p className="text-gray-600 text-xs leading-relaxed">{editing.bio}</p></div>}
              {editing.utm_source && <p className="text-[10px] text-gray-400">Source: {editing.utm_source}{editing.utm_source === 'event_registration' ? ' (registered at event)' : ''}</p>}

              <hr className="border-gray-100" />

              <div><p className="text-[10px] text-gray-400 uppercase mb-2">Status</p>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><p className="text-[10px] text-gray-400 uppercase mb-2">Admin Notes</p>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Internal notes about this practitioner" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDetail(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Close</button>
              <button onClick={saveStatus} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save Changes</button>
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}
