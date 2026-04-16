'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Document { id: string; name: string; folder: string; file_url: string; file_type: string; file_size: number; notes: string; created_at: string }

const FOLDERS = ['governance', 'finance', 'hr', 'programmes', 'marketing', 'dsac', 'legal', 'general'];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState({ name: '', folder: 'general', file_url: '', file_type: '', notes: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocs((data || []) as Document[]);
    setLoading(false);
  }

  function openNew() { setEditing(null); setForm({ name: '', folder: 'general', file_url: '', file_type: '', notes: '' }); setShowForm(true); }
  function openEdit(d: Document) { setEditing(d); setForm({ name: d.name, folder: d.folder || 'general', file_url: d.file_url || '', file_type: d.file_type || '', notes: d.notes || '' }); setShowForm(true); }

  async function handleSave() {
    if (!supabase || !form.name) return;
    const record = { name: form.name, folder: form.folder, file_url: form.file_url || null, file_type: form.file_type || null, notes: form.notes || null };
    if (editing) { await supabase.from('documents').update(record).eq('id', editing.id); }
    else { await supabase.from('documents').insert(record); }
    setShowForm(false); setEditing(null); load();
  }

  async function handleDelete(d: Document) { if (!supabase || !confirm(`Delete "${d.name}"?`)) return; await supabase.from('documents').delete().eq('id', d.id); load(); }

  const filtered = docs.filter(d => {
    if (filter !== 'all' && d.folder !== filter) return false;
    if (search) return d.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const fmtSize = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b > 1024 ? `${(b / 1024).toFixed(0)} KB` : `${b} B`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">Documents</h1><p className="text-sm text-gray-500 mt-1">Governance docs, contracts, reports, marketing materials</p></div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ Add Document</button>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`text-[10px] px-2.5 py-1 rounded transition-colors ${filter === 'all' ? 'bg-black text-white' : 'text-gray-500 border border-gray-200/60 hover:text-black'}`}>All ({docs.length})</button>
        {FOLDERS.map(f => {
          const count = docs.filter(d => d.folder === f).length;
          return <button key={f} onClick={() => setFilter(f)} className={`text-[10px] px-2.5 py-1 capitalize rounded transition-colors ${filter === f ? 'bg-black text-white' : 'text-gray-500 border border-gray-200/60 hover:text-black'}`}>{f} ({count})</button>;
        })}
      </div>
      <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-200/60 px-4 py-2 text-sm rounded focus:outline-none focus:border-black w-full max-w-sm mb-6" />

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-4">Name</span><span className="col-span-2">Folder</span><span className="col-span-1">Type</span><span className="col-span-1">Size</span><span className="col-span-2">Date</span><span className="col-span-2">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No documents found'}</div>
        ) : filtered.map(d => (
          <div key={d.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-4 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(d)}>{d.name}</span>
            <span className="col-span-2 text-[10px] text-gray-500 uppercase">{d.folder}</span>
            <span className="col-span-1 text-gray-500 text-xs">{d.file_type || '—'}</span>
            <span className="col-span-1 text-gray-500 text-xs">{d.file_size ? fmtSize(d.file_size) : '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs">{d.created_at?.split('T')[0]}</span>
            <span className="col-span-2 flex gap-1">
              {d.file_url && <a href={d.file_url} target="_blank" rel="noopener" className="text-[9px] uppercase tracking-wider px-2 py-1 border border-blue-500/30 text-blue-600 rounded hover:bg-blue-50">Open</a>}
              <button onClick={() => handleDelete(d)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button>
            </span>
          </div>
        ))}
      </div>

      {showForm && (<>
        <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Document' : 'Add Document'}</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Document name *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black capitalize">{FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}</select>
                <input value={form.file_type} onChange={e => setForm(f => ({ ...f, file_type: e.target.value }))} placeholder="File type (pdf, docx)" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              </div>
              <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="File URL (Google Drive, Dropbox, etc.)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
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
