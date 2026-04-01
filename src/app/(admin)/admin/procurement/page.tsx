'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Vendor { id: string; name: string; contact_person: string; service_type: string; rating: number; active: boolean }
interface PO { id: number; number: string; description: string; total: number; status: string; vendors?: { name: string } }

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'vendors' | 'orders'>('vendors');

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [v, p] = await Promise.all([
      supabase.from('vendors').select('*').order('name'),
      supabase.from('purchase_orders').select('*, vendors(name)').order('created_at', { ascending: false }),
    ]);
    setVendors((v.data || []) as Vendor[]);
    setPOs((p.data || []) as PO[]);
    setLoading(false);
  }

  const fmt = (n: number) => `R ${(n || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
  const stars = (n: number) => Array.from({ length: 5 }, (_, i) => i < n ? '\u2605' : '\u2606').join('');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Procurement</h1>
          <p className="text-sm text-muted mt-1">Vendors, purchase orders, three-quote compliance</p>
        </div>
        <button className="bg-accent text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-accent-light transition-colors">+ Add Vendor</button>
      </div>

      <div className="flex gap-1 mb-6">
        {(['vendors', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-4 py-2 capitalize rounded transition-colors ${tab === t ? 'bg-accent/10 text-accent border border-accent/30' : 'text-muted border border-sand/60'}`}>{t === 'orders' ? 'Purchase Orders' : t}</button>
        ))}
      </div>

      {tab === 'vendors' && (
        <div className="border border-sand/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
            <span className="col-span-3">Name</span><span className="col-span-2">Contact</span><span className="col-span-2">Service</span><span className="col-span-1">Rating</span><span className="col-span-2">Status</span>
          </div>
          {vendors.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No vendors registered'}</div>
          ) : vendors.map(v => (
            <div key={v.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors">
              <span className="col-span-3 text-ink font-medium">{v.name}</span>
              <span className="col-span-2 text-muted text-xs">{v.contact_person || '—'}</span>
              <span className="col-span-2 text-muted text-xs capitalize">{v.service_type || '—'}</span>
              <span className="col-span-1 text-accent text-xs">{stars(v.rating || 0)}</span>
              <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${v.active ? 'border-green-500/30 text-green-700' : 'border-sand/60 text-muted'}`}>{v.active ? 'Active' : 'Inactive'}</span></span>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="border border-sand/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
            <span className="col-span-2">PO#</span><span className="col-span-3">Vendor</span><span className="col-span-3">Description</span><span className="col-span-2 text-right">Total</span><span className="col-span-2">Status</span>
          </div>
          {pos.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No purchase orders'}</div>
          ) : pos.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors">
              <span className="col-span-2 font-mono text-xs text-accent">{p.number}</span>
              <span className="col-span-3 text-ink">{(p as any).vendors?.name || '—'}</span>
              <span className="col-span-3 text-muted text-xs">{p.description}</span>
              <span className="col-span-2 text-right text-ink font-medium text-xs">{fmt(p.total)}</span>
              <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'received' ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'}`}>{p.status}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
