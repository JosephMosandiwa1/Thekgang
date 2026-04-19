'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, supabaseErrorMessage } from '@/lib/utils';

interface Submission {
  id: number;
  name: string; email: string; phone: string | null;
  subject: string | null; message: string; topic: string | null;
  status: string; response_notes: string | null; responded_at: string | null;
  created_at: string;
}

const STATUSES = ['new', 'in_progress', 'responded', 'closed', 'spam'];

export default function AdminContact() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(500);
    setItems((data || []) as Submission[]);
    setLoading(false);
  }

  async function update(s: Submission, patch: Partial<Submission>) {
    if (!supabase) return;
    await supabase.from('contact_submissions').update(patch).eq('id', s.id);
    load();
    if (selected && selected.id === s.id) setSelected({ ...selected, ...patch });
  }

  async function saveResponse() {
    if (!supabase || !selected) return;
    setSaving(true);
    const { error } = await supabase.from('contact_submissions').update({
      response_notes: response,
      status: 'responded',
      responded_at: new Date().toISOString(),
    }).eq('id', selected.id);
    if (error) alert(supabaseErrorMessage(error));
    else { setSelected(null); setResponse(''); load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  const counts = STATUSES.map((s) => ({ status: s, count: items.filter((i) => i.status === s).length }));

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Contact inbox</h1>
      <p className="text-sm text-gray-500 mb-8">Enquiries, questions, and messages from the public site</p>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {counts.map((c) => (
          <div key={c.status} className="border border-gray-200 p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{c.status.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold mt-1">{c.count}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">From</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Topic</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Subject / preview</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Received</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => { setSelected(s); setResponse(s.response_notes || ''); }}>
                <td className="px-4 py-3">{s.name}<div className="text-[10px] text-gray-500">{s.email}</div></td>
                <td className="px-4 py-3 text-xs text-gray-600">{s.topic || '—'}</td>
                <td className="px-4 py-3">{s.subject && <strong className="block">{s.subject}</strong>}<span className="text-xs text-gray-500 line-clamp-1">{s.message.slice(0, 80)}…</span></td>
                <td className="px-4 py-3">
                  <select value={s.status} onClick={(e) => e.stopPropagation()} onChange={(e) => update(s, { status: e.target.value })} className="text-xs px-2 py-1 border border-gray-200 bg-white">
                    {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(s.created_at)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Inbox is empty.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{selected.topic || 'general'} · {formatDateTime(selected.created_at)}</p>
            <h3 className="font-display text-xl font-bold mb-1">{selected.subject || '(no subject)'}</h3>
            <p className="text-sm text-gray-600 mb-4">From <strong>{selected.name}</strong> &lt;{selected.email}&gt;{selected.phone && ` · ${selected.phone}`}</p>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="whitespace-pre-wrap text-sm">{selected.message}</p>
            </div>
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Response notes</span>
              <textarea rows={5} value={response} onChange={(e) => setResponse(e.target.value)} className="w-full px-3 py-2 border border-gray-200 text-sm mb-2" />
              <div className="flex gap-3">
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || 'Your enquiry')}`} className="text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white">Reply via email</a>
                <button onClick={saveResponse} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Mark responded'}</button>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-500 ml-auto">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
