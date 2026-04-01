'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const statusColors: Record<string, string> = {
  upcoming: 'border-blue-500/30 text-blue-600',
  in_progress: 'border-amber-500/30 text-amber-700',
  completed: 'border-green-500/30 text-green-700',
  overdue: 'border-red-500/30 text-red-600',
};

interface ComplianceItem { id: number; title: string; description: string; due_date: string; responsible: string; status: string; category: string; recurring: boolean }

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('compliance_items').select('*').order('due_date');
    setItems((data || []) as ComplianceItem[]);
    setLoading(false);
  }

  const overdue = items.filter(i => i.status !== 'completed' && new Date(i.due_date) < new Date()).length;
  const upcoming = items.filter(i => i.status === 'upcoming').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Compliance</h1>
        <p className="text-sm text-muted mt-1">CIPC filings, DSAC reports, audits, governance obligations</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-sand/60 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Total Items</p>
          <p className="text-2xl font-bold mt-1 text-ink">{loading ? '...' : items.length}</p>
        </div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Upcoming</p>
          <p className="text-2xl font-bold mt-1 text-amber-700">{loading ? '...' : upcoming}</p>
        </div>
        <div className={`border rounded p-4 ${overdue > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Overdue</p>
          <p className={`text-2xl font-bold mt-1 ${overdue > 0 ? 'text-red-600' : 'text-green-700'}`}>{loading ? '...' : overdue}</p>
        </div>
      </div>

      <div className="border border-sand/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
          <span className="col-span-4">Obligation</span><span className="col-span-2">Category</span><span className="col-span-2">Due Date</span><span className="col-span-2">Responsible</span><span className="col-span-2">Status</span>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No compliance items — run the migration to seed data'}</div>
        ) : items.map(i => {
          const isOverdue = i.status !== 'completed' && new Date(i.due_date) < new Date();
          const status = isOverdue ? 'overdue' : i.status;
          return (
            <div key={i.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors">
              <span className="col-span-4 text-ink font-medium">{i.title}{i.recurring && <span className="ml-1 text-[9px] text-muted/40">recurring</span>}</span>
              <span className="col-span-2 text-muted text-xs uppercase">{i.category}</span>
              <span className={`col-span-2 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted'}`}>{i.due_date}</span>
              <span className="col-span-2 text-muted text-xs">{i.responsible}</span>
              <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${statusColors[status] || statusColors.upcoming}`}>{status.replace('_', ' ')}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
