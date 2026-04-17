'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Vendor { id: string; name: string; contact_person: string; email: string; phone: string; service_type: string; rating: number; active: boolean; notes: string }
interface PO { id: number; number: string; vendor_id: string; description: string; amount: number; vat: number; total: number; status: string; notes: string; created_at: string; vendors?: { name: string } }

const SERVICE_TYPES = ['venue', 'printing', 'design', 'catering', 'travel', 'other'];
const PO_STATUSES = ['draft', 'approved', 'sent', 'received', 'cancelled'];
const poStatusColors: Record<string, string> = { draft: 'border-gray-200 text-gray-500', approved: 'border-green-500/30 text-green-700', sent: 'border-blue-500/30 text-blue-600', received: 'border-green-500/30 text-green-700', cancelled: 'border-red-500/30 text-red-600' };

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'vendors' | 'pos'>('vendors');
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vForm, setVForm] = useState({ name: '', contact_person: '', email: '', phone: '', service_type: 'other', rating: 0, notes: '' });
  const [showPOForm, setShowPOForm] = useState(false);
  const [editingPO, setEditingPO] = useState<PO | null>(null);
  const [poForm, setPoForm] = useState({ vendor_id: '', description: '', amount: '', status: 'draft', notes: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [v, p] = await Promise.all([
      supabase.from('vendors').select('*').order('name'),
      supabase.from('purchase_orders').select('*, vendors(name)').order('created_at', { ascending: false }),
    ]);
    setVendors((v.data || []) as Vendor[]);
    setPos((p.data || []) as PO[]);
    setLoading(false);
  }

  // Vendors CRUD
  function openNewVendor() { setEditingVendor(null); setVForm({ name: '', contact_person: '', email: '', phone: '', service_type: 'other', rating: 0, notes: '' }); setShowVendorForm(true); }
  function openEditVendor(v: Vendor) { setEditingVendor(v); setVForm({ name: v.name, contact_person: v.contact_person || '', email: v.email || '', phone: v.phone || '', service_type: v.service_type || 'other', rating: v.rating || 0, notes: v.notes || '' }); setShowVendorForm(true); }
  async function saveVendor() {
    if (!supabase || !vForm.name) return;
    const record = { name: vForm.name, contact_person: vForm.contact_person || null, email: vForm.email || null, phone: vForm.phone || null, service_type: vForm.service_type, rating: vForm.rating, notes: vForm.notes || null };
    if (editingVendor) { await supabase.from('vendors').update(record).eq('id', editingVendor.id); }
    else { await supabase.from('vendors').insert({ ...record, active: true }); }
    setShowVendorForm(false); setEditingVendor(null); load();
  }
  async function deleteVendor(v: Vendor) { if (!supabase || !confirm(`Delete vendor "${v.name}"?`)) return; await supabase.from('vendors').delete().eq('id', v.id); load(); }

  // PO CRUD
  function openNewPO() { setEditingPO(null); setPoForm({ vendor_id: '', description: '', amount: '', status: 'draft', notes: '' }); setShowPOForm(true); }
  function openEditPO(p: PO) { setEditingPO(p); setPoForm({ vendor_id: p.vendor_id, description: p.description || '', amount: String(p.amount || ''), status: p.status, notes: p.notes || '' }); setShowPOForm(true); }
  async function savePO() {
    if (!supabase || !poForm.vendor_id || !poForm.description) return;
    const amount = parseFloat(poForm.amount) || 0;
    const vat = amount * 0.15;
    const record = { vendor_id: poForm.vendor_id, description: poForm.description, amount, vat, total: amount + vat, status: poForm.status, notes: poForm.notes || null };
    if (editingPO) { await supabase.from('purchase_orders').update(record).eq('id', editingPO.id); }
    else { await supabase.from('purchase_orders').insert(record); }
    setShowPOForm(false); setEditingPO(null); load();
  }
  async function deletePO(p: PO) { if (!supabase || !confirm('Delete this PO?')) return; await supabase.from('purchase_orders').delete().eq('id', p.id); load(); }

  const fmt = (n: number) => `R ${(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-display font-bold text-black">Procurement</h1><p className="text-sm text-gray-500 mt-1">Vendor register, purchase orders, quotes</p></div>
        <button onClick={tab === 'vendors' ? openNewVendor : openNewPO} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800">+ {tab === 'vendors' ? 'Add Vendor' : 'New PO'}</button>
      </div>

      <div className="flex gap-1 mb-6">
        <button onClick={() => setTab('vendors')} className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded ${tab === 'vendors' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>Vendors ({vendors.length})</button>
        <button onClick={() => setTab('pos')} className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded ${tab === 'pos' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>Purchase Orders ({pos.length})</button>
      </div>

      {tab === 'vendors' && (
        <div className="border border-gray-200/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
            <span className="col-span-3">Vendor</span><span className="col-span-2">Contact</span><span className="col-span-2">Service</span><span className="col-span-1">Rating</span><span className="col-span-2">Email</span><span className="col-span-2">Actions</span>
          </div>
          {vendors.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No vendors'}</div>
          ) : vendors.map(v => (
            <div key={v.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
              <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEditVendor(v)}>{v.name}</span>
              <span className="col-span-2 text-gray-500 text-xs">{v.contact_person || '—'}</span>
              <span className="col-span-2 text-[10px] text-gray-500 capitalize">{v.service_type}</span>
              <span className="col-span-1 text-xs text-gray-500">{Array(v.rating || 0).fill('★').join('')}{Array(5 - (v.rating || 0)).fill('☆').join('')}</span>
              <span className="col-span-2 text-gray-500 text-xs truncate">{v.email || '—'}</span>
              <span className="col-span-2 flex gap-1">
                <button onClick={() => openEditVendor(v)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50">Edit</button>
                <button onClick={() => deleteVendor(v)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'pos' && (
        <div className="border border-gray-200/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
            <span className="col-span-1">#</span><span className="col-span-3">Description</span><span className="col-span-2">Vendor</span><span className="col-span-2">Total</span><span className="col-span-1">Status</span><span className="col-span-1">Date</span><span className="col-span-2">Actions</span>
          </div>
          {pos.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">{loading ? 'Loading...' : 'No purchase orders'}</div>
          ) : pos.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
              <span className="col-span-1 text-gray-500 text-xs font-mono">{p.number}</span>
              <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEditPO(p)}>{p.description}</span>
              <span className="col-span-2 text-gray-500 text-xs">{(p as any).vendors?.name || '—'}</span>
              <span className="col-span-2 text-black font-mono text-xs">{fmt(p.total)}</span>
              <span className="col-span-1"><span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${poStatusColors[p.status] || 'border-gray-200 text-gray-500'}`}>{p.status}</span></span>
              <span className="col-span-1 text-gray-500 text-xs">{p.created_at?.split('T')[0]}</span>
              <span className="col-span-2 flex gap-1">
                <button onClick={() => openEditPO(p)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50">Edit</button>
                <button onClick={() => deletePO(p)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Form */}
      {showVendorForm && (<>
        <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowVendorForm(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-base font-display font-bold text-black mb-4">{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
            <div className="space-y-3">
              <input value={vForm.name} onChange={e => setVForm(f => ({ ...f, name: e.target.value }))} placeholder="Vendor name *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <div className="grid grid-cols-2 gap-3">
                <input value={vForm.contact_person} onChange={e => setVForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Contact person" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <select value={vForm.service_type} onChange={e => setVForm(f => ({ ...f, service_type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black capitalize">{SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={vForm.email} onChange={e => setVForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={vForm.phone} onChange={e => setVForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              </div>
              <div><p className="text-xs text-gray-500 mb-1">Rating</p><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setVForm(f => ({ ...f, rating: s }))} className={`text-xl ${s <= vForm.rating ? 'text-gray-500' : 'text-gray-200 hover:text-gray-500/50'}`}>★</button>)}</div></div>
              <textarea value={vForm.notes} onChange={e => setVForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowVendorForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
              <button onClick={saveVendor} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      </>)}

      {/* PO Form */}
      {showPOForm && (<>
        <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowPOForm(false)} />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-base font-display font-bold text-black mb-4">{editingPO ? 'Edit PO' : 'New Purchase Order'}</h3>
            <div className="space-y-3">
              <select value={poForm.vendor_id} onChange={e => setPoForm(f => ({ ...f, vendor_id: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                <option value="">Select vendor *</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <input value={poForm.description} onChange={e => setPoForm(f => ({ ...f, description: e.target.value }))} placeholder="Description *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <div className="grid grid-cols-2 gap-3">
                <input value={poForm.amount} onChange={e => setPoForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (excl. VAT)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <select value={poForm.status} onChange={e => setPoForm(f => ({ ...f, status: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">{PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              {poForm.amount && (
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>Amount:</span><span className="font-mono">{fmt(parseFloat(poForm.amount) || 0)}</span></div>
                  <div className="flex justify-between"><span>VAT (15%):</span><span className="font-mono">{fmt((parseFloat(poForm.amount) || 0) * 0.15)}</span></div>
                  <div className="flex justify-between font-semibold text-black"><span>Total:</span><span className="font-mono">{fmt((parseFloat(poForm.amount) || 0) * 1.15)}</span></div>
                </div>
              )}
              <textarea value={poForm.notes} onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPOForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
              <button onClick={savePO} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      </>)}
    </div>
  );
}
