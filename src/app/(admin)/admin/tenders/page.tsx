'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, supabaseErrorMessage } from '@/lib/utils';

interface Tender {
  id: number;
  source: string | null;
  external_ref: string | null;
  title: string;
  issuer: string | null;
  description: string | null;
  category: string | null;
  value_rands: number | null;
  cidb_grade_required: string | null;
  province: string | null;
  discovered_at: string | null;
  closes_at: string | null;
  award_date: string | null;
  status: string;
  relevance_score: number | null;
  fit_notes: string | null;
}

interface Bid {
  id: number;
  tender_id: number;
  decision: string;
  decision_notes: string | null;
  bid_amount_rands: number | null;
  submitted_at: string | null;
  outcome: string | null;
  cidb_registered: boolean;
}

const STATUS = ['discovered', 'reviewing', 'bid_decided', 'bidding', 'submitted', 'awarded_self', 'awarded_competitor', 'lost', 'withdrawn'];

export default function AdminTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Tender> | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [t, b] = await Promise.all([
      supabase.from('tenders').select('*').order('closes_at', { ascending: true, nullsFirst: false }),
      supabase.from('tender_bids').select('*'),
    ]);
    setTenders(((t.data || []) as unknown) as Tender[]);
    setBids(((b.data || []) as unknown) as Bid[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !editing?.title) return;
    setSaving(true); setMessage(null);
    const { error } = editing.id
      ? await supabase.from('tenders').update(editing).eq('id', editing.id)
      : await supabase.from('tenders').insert(editing);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
    setSaving(false);
  }

  async function decide(t: Tender, decision: 'bid' | 'no_bid') {
    if (!supabase) return;
    const existing = bids.find((b) => b.tender_id === t.id);
    if (existing) {
      await supabase.from('tender_bids').update({ decision, decision_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('tender_bids').insert({ tender_id: t.id, decision, decision_at: new Date().toISOString() });
    }
    await supabase.from('tenders').update({ status: 'bid_decided' }).eq('id', t.id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Tender pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Opportunities from eTenders, L2B, Construction Monitor and direct referrals</p>
        </div>
        <button onClick={() => setEditing({ source: 'direct', status: 'discovered' })} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">
          + Log tender
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {['discovered', 'bid_decided', 'submitted', 'awarded_self'].map((s) => (
          <div key={s} className="border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{s.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-bold mt-1">{tenders.filter((t) => t.status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Ref</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Issuer</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Closes</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => {
              const bid = bids.find((b) => b.tender_id === t.id);
              return (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{t.external_ref || '—'}</td>
                  <td className="px-4 py-3 font-medium">{t.title}{t.category && <div className="text-[10px] text-gray-500">{t.category}</div>}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{t.issuer || '—'}{t.province && <div className="text-[10px] text-gray-500">{t.province}</div>}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{t.value_rands ? formatRand(t.value_rands) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{t.closes_at ? formatDate(t.closes_at, 'short') : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                      t.status === 'awarded_self' ? 'bg-green-100 text-green-700'
                        : t.status === 'lost' || t.status === 'awarded_competitor' ? 'bg-red-100 text-red-700'
                        : t.status === 'submitted' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>{t.status.replace(/_/g, ' ')}</span>
                    {bid && <div className="text-[10px] text-gray-500 mt-1">Decision: {bid.decision}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!bid && t.status === 'discovered' && (
                      <div className="flex gap-2 justify-end text-xs">
                        <button onClick={() => decide(t, 'bid')} className="text-black hover:underline">Bid</button>
                        <button onClick={() => decide(t, 'no_bid')} className="text-gray-500 hover:underline">No-bid</button>
                      </div>
                    )}
                    {bid && <button onClick={() => setSelectedBid(bid)} className="text-xs text-gray-500 hover:text-black">Bid →</button>}
                    <button onClick={() => setEditing(t)} className="text-xs text-gray-500 hover:text-black ml-2">Edit →</button>
                  </td>
                </tr>
              );
            })}
            {tenders.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No tenders logged.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit tender' : 'Log tender'}</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Source</span>
                  <select value={editing.source ?? 'direct'} onChange={(e) => setEditing({ ...editing, source: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="etenders">eTenders</option>
                    <option value="leads2business">Leads2Business</option>
                    <option value="construction_monitor">Construction Monitor</option>
                    <option value="national_treasury">National Treasury</option>
                    <option value="provincial">Provincial</option>
                    <option value="referral">Referral</option>
                    <option value="direct">Direct</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">External ref</span>
                  <input value={editing.external_ref ?? ''} onChange={(e) => setEditing({ ...editing, external_ref: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span>
                <input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Issuer</span>
                  <input value={editing.issuer ?? ''} onChange={(e) => setEditing({ ...editing, issuer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Value (ZAR)</span>
                  <input type="number" value={editing.value_rands ?? ''} onChange={(e) => setEditing({ ...editing, value_rands: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Closes</span>
                  <input type="datetime-local" value={editing.closes_at?.slice(0, 16) ?? ''} onChange={(e) => setEditing({ ...editing, closes_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">CIDB grade</span>
                  <input value={editing.cidb_grade_required ?? ''} onChange={(e) => setEditing({ ...editing, cidb_grade_required: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                  <select value={editing.status ?? 'discovered'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Fit notes</span>
                <textarea rows={2} value={editing.fit_notes ?? ''} onChange={(e) => setEditing({ ...editing, fit_notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              {message && <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 disabled:opacity-50">Save</button>
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedBid && <BidDetail bid={selectedBid} onClose={() => setSelectedBid(null)} onChange={load} />}
    </div>
  );
}

function BidDetail({ bid, onClose, onChange }: { bid: Bid; onClose: () => void; onChange: () => void }) {
  const [b, setB] = useState(bid);

  async function save() {
    if (!supabase) return;
    await supabase.from('tender_bids').update(b).eq('id', b.id);
    onChange();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold mb-4">Bid detail</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Bid amount (ZAR)</span>
            <input type="number" value={b.bid_amount_rands ?? ''} onChange={(e) => setB({ ...b, bid_amount_rands: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Decision notes</span>
            <textarea rows={3} value={b.decision_notes ?? ''} onChange={(e) => setB({ ...b, decision_notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Outcome</span>
            <select value={b.outcome ?? 'pending'} onChange={(e) => setB({ ...b, outcome: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
              <option value="pending">Pending</option>
              <option value="awarded">Awarded</option>
              <option value="unsuccessful">Unsuccessful</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={b.cidb_registered} onChange={(e) => setB({ ...b, cidb_registered: e.target.checked })} />
            CIDB contract registered (required within 21 days of award)
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={save} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2">Save</button>
          <button onClick={onClose} className="text-xs text-gray-500">Cancel</button>
        </div>
      </div>
    </div>
  );
}
