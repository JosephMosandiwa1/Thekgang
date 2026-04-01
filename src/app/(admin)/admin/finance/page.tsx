'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function FinancePage() {
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [rev, exp, out] = await Promise.all([
      supabase.from('invoices').select('total').eq('status', 'paid'),
      supabase.from('expenses').select('total').in('status', ['approved', 'paid']),
      supabase.from('invoices').select('total').in('status', ['sent', 'partially_paid', 'overdue']),
    ]);
    setRevenue((rev.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0));
    setExpenses((exp.data || []).reduce((s: number, e: any) => s + (e.total || 0), 0));
    setOutstanding((out.data || []).reduce((s: number, i: any) => s + (i.total || 0), 0));
    setLoading(false);
  }

  const fmt = (n: number) => `R ${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Finance</h1>
        <p className="text-sm text-muted mt-1">DSAC budget tracking, expenses, invoices, ledger</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'DSAC Allocation', value: 'R 2 000 000', color: 'text-ink', bg: 'border-sand/60' },
          { label: 'Revenue Received', value: fmt(revenue), color: 'text-green-700', bg: 'border-green-500/30 bg-green-500/5' },
          { label: 'Expenses', value: fmt(expenses), color: 'text-red-600', bg: 'border-red-500/30 bg-red-500/5' },
          { label: 'Outstanding', value: fmt(outstanding), color: 'text-amber-700', bg: 'border-amber-500/30 bg-amber-500/5' },
        ].map(c => (
          <div key={c.label} className={`border rounded p-5 ${c.bg}`}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">{c.label}</p>
            <p className={`text-2xl font-bold mt-2 ${c.color}`}>{loading ? '...' : c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-sand/60 rounded p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {['Record Expense', 'Create Invoice', 'View Ledger', 'Budget vs Actual', 'DSAC Financial Report'].map(a => (
              <button key={a} className="w-full text-left px-4 py-3 text-sm border border-sand/40 rounded hover:bg-warm-gray/30 hover:border-accent/20 transition-colors">{a}</button>
            ))}
          </div>
        </div>

        <div className="border border-sand/60 rounded p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-4">Budget Allocation (DSAC MOA)</h2>
          <div className="space-y-3">
            {[
              { item: 'Programme Delivery', amount: 1400000, percent: 70 },
              { item: 'Governance & Admin', amount: 400000, percent: 20 },
              { item: 'Marketing & Comms', amount: 200000, percent: 10 },
            ].map(b => (
              <div key={b.item}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink/60">{b.item}</span>
                  <span className="text-ink font-medium">{fmt(b.amount)} ({b.percent}%)</span>
                </div>
                <div className="h-2 bg-sand/40 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${b.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
