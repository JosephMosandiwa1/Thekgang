'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface OnixRecord {
  id?: number;
  book_id: number | null;
  isbn: string;
  onix_version: string;
  product_form: string | null;
  language_code: string;
  country_code: string;
  publication_status: string | null;
  imprint: string | null;
  audience_age_min: number | null;
  audience_age_max: number | null;
  thema_subject_codes: string[];
  bic_codes: string[];
  bisac_codes: string[];
  keywords: string[];
  rights_territory: string[];
  raw_xml: string | null;
  verified: boolean;
}

const EMPTY: OnixRecord = {
  book_id: null, isbn: '', onix_version: '3.0',
  product_form: 'BB', language_code: 'eng', country_code: 'ZA',
  publication_status: '04', imprint: null,
  audience_age_min: null, audience_age_max: null,
  thema_subject_codes: [], bic_codes: [], bisac_codes: [], keywords: [],
  rights_territory: ['ZA'], raw_xml: null, verified: false,
};

const PRODUCT_FORMS: Record<string, string> = { BA: 'Book · Paperback', BB: 'Book · Hardback', BC: 'Book · Loose-leaf', BP: 'Paperback', BG: 'Paperback with jacket', EA: 'Digital · ebook', EB: 'Digital · audiobook', EC: 'Digital · web-only', PC: 'Multiple-component retail product' };

export default function AdminOnix() {
  const [rows, setRows] = useState<OnixRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OnixRecord | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('onix_records').select('*').order('updated_at', { ascending: false });
    setRows((data || []) as OnixRecord[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing) return;
    const { error } = editing.id ? await supabase.from('onix_records').update(editing).eq('id', editing.id) : await supabase.from('onix_records').insert(editing);
    if (error) alert(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
  }

  const filtered = rows.filter((r) => !q.trim() || r.isbn.includes(q) || r.imprint?.toLowerCase().includes(q.toLowerCase()));
  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">ONIX metadata</h1>
          <p className="text-sm text-gray-500 mt-1">ONIX 3.0 product-metadata records · Thema / BIC / BISAC subject codes · public API at /api/onix/[isbn]</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New record</button>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ISBN or imprint…" className="w-full md:max-w-md px-3 py-2 border border-gray-200 text-sm mb-4" />

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">ISBN</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Form</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Language</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Imprint</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Thema codes</th><th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Verified</th><th className="text-right px-4 py-3"></th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-mono text-xs">{r.isbn}</td>
                <td className="px-4 py-3 text-xs">{PRODUCT_FORMS[r.product_form || ''] || r.product_form || '—'}</td>
                <td className="px-4 py-3 text-xs">{r.language_code}</td>
                <td className="px-4 py-3 text-xs">{r.imprint || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.thema_subject_codes.slice(0, 4).join(', ')}</td>
                <td className="px-4 py-3 text-center">{r.verified ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 uppercase">yes</span> : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 uppercase">no</span>}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditing(r)} className="text-xs text-gray-500 hover:text-black">Edit →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit' : 'New'} ONIX record</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">ISBN *</span><input value={editing.isbn} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Book id (optional FK)</span><input type="number" value={editing.book_id ?? ''} onChange={(e) => setEditing({ ...editing, book_id: Number(e.target.value) || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Product form (ONIX 150)</span>
                  <select value={editing.product_form || ''} onChange={(e) => setEditing({ ...editing, product_form: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="">—</option>
                    {Object.entries(PRODUCT_FORMS).map(([k, v]) => <option key={k} value={k}>{k} · {v}</option>)}
                  </select>
                </label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Language (ISO 639-2/B)</span><input value={editing.language_code} onChange={(e) => setEditing({ ...editing, language_code: e.target.value })} placeholder="eng, zul, xho, afr" className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Country</span><input value={editing.country_code} onChange={(e) => setEditing({ ...editing, country_code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Imprint</span><input value={editing.imprint || ''} onChange={(e) => setEditing({ ...editing, imprint: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Publication status (ONIX 64)</span><input value={editing.publication_status || ''} onChange={(e) => setEditing({ ...editing, publication_status: e.target.value })} placeholder="04 = published" className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Thema subject codes (comma-separated)</span><input value={editing.thema_subject_codes.join(', ')} onChange={(e) => setEditing({ ...editing, thema_subject_codes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="FBA, FBAN, 1HFDZA" className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Keywords (comma-separated)</span><input value={editing.keywords.join(', ')} onChange={(e) => setEditing({ ...editing, keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="w-full px-3 py-2 border border-gray-200 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Rights territory</span><input value={editing.rights_territory.join(', ')} onChange={(e) => setEditing({ ...editing, rights_territory: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) })} placeholder="ZA, NA, BW" className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Raw ONIX XML (optional · for full ingest)</span><textarea rows={4} value={editing.raw_xml || ''} onChange={(e) => setEditing({ ...editing, raw_xml: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-xs font-mono" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.verified} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} />Verified</label>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
