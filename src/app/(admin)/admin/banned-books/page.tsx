'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface Banned {
  id?: number; book_title: string; author: string | null; isbn: string | null;
  challenge_type: string; institution: string | null; location: string | null;
  reason_stated: string | null; date_of_event: string | null;
  council_response: string | null; council_response_url: string | null;
  public: boolean; source_url: string | null;
}

const TYPES = ['ban', 'restriction', 'removal', 'challenge', 'reinstated'];

export default function AdminBannedBooks() {
  const [rows, setRows] = useState<Banned[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banned | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('banned_books').select('*').order('date_of_event', { ascending: false, nullsFirst: false });
    setRows((data || []) as Banned[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const { error } = editing.id ? await supabase.from('banned_books').update(editing).eq('id', editing.id) : await supabase.from('banned_books').insert(editing);
    if (error) alert(supabaseErrorMessage(error)); else { setEditing(null); load(); }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div><h1 className="text-2xl font-display font-bold">Banned / challenged books</h1><p className="text-sm text-gray-500 mt-1">Public record of censorship events and Council response</p></div>
        <button onClick={() => setEditing({ book_title: '', author: null, isbn: null, challenge_type: 'challenge', institution: null, location: null, reason_stated: null, date_of_event: null, council_response: null, council_response_url: null, public: true, source_url: null })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ Add entry</button>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Book</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Author</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Where</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">When</th><th className="text-right px-4 py-3"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{r.book_title}{r.isbn && <div className="text-[10px] text-gray-400 font-mono">{r.isbn}</div>}</td>
                <td className="px-4 py-3 text-xs">{r.author || '—'}</td>
                <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 ${r.challenge_type === 'reinstated' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.challenge_type}</span></td>
                <td className="px-4 py-3 text-xs">{r.institution || '—'}{r.location && <div className="text-[10px] text-gray-500">{r.location}</div>}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.date_of_event ? formatDate(r.date_of_event, 'short') : '—'}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(r)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} entry</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Book title *</span><input value={editing.book_title} onChange={(e) => setEditing({ ...editing, book_title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Author</span><input value={editing.author || ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">ISBN</span><input value={editing.isbn || ''} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Type</span>
                  <select value={editing.challenge_type} onChange={(e) => setEditing({ ...editing, challenge_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Date of event</span><input type="date" value={editing.date_of_event || ''} onChange={(e) => setEditing({ ...editing, date_of_event: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Institution</span><input value={editing.institution || ''} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Location</span><input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Stated reason</span><textarea rows={2} value={editing.reason_stated || ''} onChange={(e) => setEditing({ ...editing, reason_stated: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Council response</span><textarea rows={3} value={editing.council_response || ''} onChange={(e) => setEditing({ ...editing, council_response: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Response URL</span><input value={editing.council_response_url || ''} onChange={(e) => setEditing({ ...editing, council_response_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Source URL</span><input value={editing.source_url || ''} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.public} onChange={(e) => setEditing({ ...editing, public: e.target.checked })} />Public</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
