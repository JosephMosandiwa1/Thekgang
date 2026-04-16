'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatRand, getFinancialPosition, getJournalEntries, getBudgetStatus, recordExpenseEntry, recordGrantReceipt } from '@/lib/accountingEngine';

/* ============================================================
   CDCC Finance — Sage Replica
   Tabs: Dashboard | Expenses | Ledger | Budget | Reports
   Double-entry bookkeeping, requisitions, DSAC reporting.
   ============================================================ */

type Tab = 'dashboard' | 'expenses' | 'ledger' | 'budget' | 'reports';

interface Expense { id: number; number: string; description: string; amount: number; vat_amount: number; total: number; expense_date: string; status: string; category_id: number; receipt_url: string }
interface JournalEntry { id: number; number: string; entry_date: string; entry_type: string; description: string; status: string; journal_entry_lines: { account_code: string; description: string; debit: number; credit: number }[] }

const EXPENSE_CATEGORIES = [
  { label: 'Administration', code: '5100' },
  { label: 'Transport & Accommodation', code: '5200' },
  { label: 'IT & Equipment', code: '5300' },
  { label: 'Programme Implementation', code: '5400' },
  { label: 'Branding & Comms', code: '5500' },
  { label: 'Monitoring & Reporting', code: '5600' },
  { label: 'Board Meeting', code: '5700' },
  { label: 'Board Fees', code: '5800' },
  { label: 'Professional Fees', code: '5900' },
  { label: 'Other', code: '5950' },
];

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Dashboard state
  const [position, setPosition] = useState<any>(null);

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: '5400', expense_date: '', receipt_url: '' });

  // Ledger state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  // Budget state
  const [budgets, setBudgets] = useState<any[]>([]);

  // Grant receipt
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState({ amount: '', reference: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    if (!supabase) { setLoading(false); return; }
    const [pos, exp, je, bud] = await Promise.all([
      getFinancialPosition(),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      getJournalEntries(),
      getBudgetStatus(),
    ]);
    setPosition(pos);
    setExpenses((exp.data || []) as Expense[]);
    setEntries(je as JournalEntry[]);
    setBudgets(bud);
    setLoading(false);
  }

  // Record expense
  async function handleRecordExpense() {
    if (!supabase || !expForm.description || !expForm.amount) return;
    const amount = parseFloat(expForm.amount);
    const vat = amount * 0.15;
    const total = amount + vat;

    await supabase.from('expenses').insert({
      description: expForm.description,
      amount, vat_amount: vat, total,
      expense_date: expForm.expense_date || new Date().toISOString().split('T')[0],
      status: 'approved',
      receipt_url: expForm.receipt_url || null,
    });

    // Create journal entry
    await recordExpenseEntry(expForm.description, total, expForm.category);

    setShowExpenseForm(false);
    setExpForm({ description: '', amount: '', category: '5400', expense_date: '', receipt_url: '' });
    loadAll();
  }

  // Record grant
  async function handleRecordGrant() {
    if (!grantForm.amount || !grantForm.reference) return;
    await recordGrantReceipt(parseFloat(grantForm.amount), grantForm.reference);
    setShowGrantForm(false);
    setGrantForm({ amount: '', reference: '' });
    loadAll();
  }

  async function deleteExpense(exp: Expense) {
    if (!supabase || !confirm(`Delete expense "${exp.description}"?`)) return;
    await supabase.from('expenses').delete().eq('id', exp.id);
    loadAll();
  }

  const entryTypeColors: Record<string, string> = { accrual: 'text-blue-600 bg-blue-50', payment: 'text-green-700 bg-green-50', expense: 'text-red-600 bg-red-50', grant_receipt: 'text-amber-700 bg-amber-50', adjustment: 'text-gray-600 bg-gray-50' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display font-bold text-black">Finance</h1><p className="text-sm text-gray-500 mt-1">Sage-replica accounting — double-entry ledger, budget tracking, DSAC reporting</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowGrantForm(true)} className="border border-green-500/30 text-green-700 text-[10px] font-medium tracking-wider px-4 py-2 uppercase rounded hover:bg-green-50">+ Record Grant</button>
          <button onClick={() => { setShowExpenseForm(true); setTab('expenses'); }} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2 uppercase rounded hover:bg-gray-800">+ Record Expense</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200/60 pb-2">
        {(['dashboard', 'expenses', 'ledger', 'budget', 'reports'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded-t transition-colors ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400 text-sm">Loading...</div> : (
        <>
          {/* TAB: Dashboard */}
          {tab === 'dashboard' && position && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="border border-green-500/30 bg-green-500/5 rounded p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Revenue</p><p className="text-2xl font-bold mt-2 text-green-700">{formatRand(position.revenue)}</p></div>
                <div className="border border-red-500/30 bg-red-500/5 rounded p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Expenses</p><p className="text-2xl font-bold mt-2 text-red-600">{formatRand(position.expenses)}</p></div>
                <div className={`border rounded p-5 ${position.netSurplus >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Net Surplus</p><p className={`text-2xl font-bold mt-2 ${position.netSurplus >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRand(position.netSurplus)}</p></div>
                <div className="border border-gray-200/60 rounded p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Cash at Bank</p><p className="text-2xl font-bold mt-2 text-black">{formatRand(position.assets)}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200/60 rounded p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Income Statement</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Total Revenue</span><span className="text-green-700 font-mono font-medium">{formatRand(position.revenue)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Expenses</span><span className="text-red-600 font-mono font-medium">({formatRand(position.expenses)})</span></div>
                    <div className="border-t border-gray-200/60 pt-2 flex justify-between font-semibold"><span className="text-black">Net Surplus/(Deficit)</span><span className={`font-mono ${position.netSurplus >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRand(position.netSurplus)}</span></div>
                  </div>
                </div>
                <div className="border border-gray-200/60 rounded p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Balance Sheet</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Total Assets</span><span className="text-black font-mono font-medium">{formatRand(position.assets)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Liabilities</span><span className="text-black font-mono font-medium">{formatRand(position.liabilities)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Equity</span><span className="text-black font-mono font-medium">{formatRand(position.equity)}</span></div>
                    <div className="border-t border-gray-200/60 pt-2 flex justify-between font-semibold"><span className="text-black">Liabilities + Equity</span><span className="text-black font-mono">{formatRand(position.liabilities + position.equity)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Expenses */}
          {tab === 'expenses' && (
            <div>
              <div className="border border-gray-200/60 rounded">
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
                  <span className="col-span-1">#</span><span className="col-span-3">Description</span><span className="col-span-2">Date</span><span className="col-span-2">Amount</span><span className="col-span-1">VAT</span><span className="col-span-1">Total</span><span className="col-span-2">Actions</span>
                </div>
                {expenses.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400 text-sm">No expenses recorded</div>
                ) : expenses.map(exp => (
                  <div key={exp.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
                    <span className="col-span-1 text-gray-500 text-xs font-mono">{exp.number}</span>
                    <span className="col-span-3 text-black font-medium">{exp.description}</span>
                    <span className="col-span-2 text-gray-500 text-xs">{exp.expense_date}</span>
                    <span className="col-span-2 text-black font-mono text-xs">{formatRand(exp.amount)}</span>
                    <span className="col-span-1 text-gray-500 font-mono text-xs">{formatRand(exp.vat_amount)}</span>
                    <span className="col-span-1 text-black font-mono text-xs font-semibold">{formatRand(exp.total)}</span>
                    <span className="col-span-2"><button onClick={() => deleteExpense(exp)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50">Del</button></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Ledger */}
          {tab === 'ledger' && (
            <div>
              <div className="border border-gray-200/60 rounded">
                {entries.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400 text-sm">No journal entries</div>
                ) : entries.map((je: any) => (
                  <div key={je.id} className="border-b border-gray-200/30 last:border-0">
                    <div className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedEntry(expandedEntry === je.id ? null : je.id)}>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${entryTypeColors[je.entry_type] || 'text-gray-600 bg-gray-50'}`}>{je.entry_type?.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">{je.entry_date}</span>
                        <span className="text-sm text-black">{je.description}</span>
                      </div>
                      <span className="text-xs text-gray-400">{expandedEntry === je.id ? '▲' : '▼'}</span>
                    </div>
                    {expandedEntry === je.id && je.journal_entry_lines && (
                      <div className="px-6 pb-3 bg-gray-50/50">
                        <div className="grid grid-cols-12 gap-2 py-2 text-[9px] uppercase tracking-wider text-gray-400">
                          <span className="col-span-2">Account</span><span className="col-span-5">Description</span><span className="col-span-2 text-right">Debit</span><span className="col-span-2 text-right">Credit</span>
                        </div>
                        {je.journal_entry_lines.map((line: any, i: number) => (
                          <div key={i} className="grid grid-cols-12 gap-2 py-1 text-xs">
                            <span className="col-span-2 font-mono text-gray-600">{line.account_code}</span>
                            <span className="col-span-5 text-gray-600">{line.description}</span>
                            <span className="col-span-2 text-right font-mono">{line.debit > 0 ? formatRand(line.debit) : ''}</span>
                            <span className="col-span-2 text-right font-mono">{line.credit > 0 ? formatRand(line.credit) : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Budget */}
          {tab === 'budget' && (
            <div>
              <div className="border border-gray-200/60 rounded">
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
                  <span className="col-span-4">Budget Line</span><span className="col-span-2 text-right">Allocated</span><span className="col-span-2 text-right">Spent</span><span className="col-span-2 text-right">Remaining</span><span className="col-span-2">Utilisation</span>
                </div>
                {budgets.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400 text-sm">No budget data — run the accounting migration</div>
                ) : budgets.map((b: any, i: number) => {
                  const util = b.utilisation || 0;
                  const color = util > 90 ? 'text-red-600' : util > 70 ? 'text-amber-700' : 'text-green-700';
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm">
                      <span className="col-span-4 text-black font-medium">{b.name || b.account_code}</span>
                      <span className="col-span-2 text-right font-mono text-gray-600">{formatRand(b.allocated_amount || 0)}</span>
                      <span className="col-span-2 text-right font-mono text-black">{formatRand(b.spent || 0)}</span>
                      <span className="col-span-2 text-right font-mono text-gray-600">{formatRand(b.remaining || 0)}</span>
                      <span className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${util > 90 ? 'bg-red-500' : util > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, util)}%` }} /></div>
                          <span className={`text-[10px] font-mono font-semibold ${color}`}>{util.toFixed(0)}%</span>
                        </div>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Reports */}
          {tab === 'reports' && position && (
            <div className="space-y-6">
              {/* Trial Balance */}
              <div className="border border-gray-200/60 rounded p-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Trial Balance</h3>
                <div className="grid grid-cols-12 gap-2 py-2 text-[9px] uppercase tracking-wider text-gray-400 border-b border-gray-200/60">
                  <span className="col-span-1">Code</span><span className="col-span-5">Account</span><span className="col-span-3 text-right">Debit</span><span className="col-span-3 text-right">Credit</span>
                </div>
                {position.trialBalance.map((a: any) => (
                  <div key={a.code} className="grid grid-cols-12 gap-2 py-2 text-xs border-b border-gray-100 last:border-0">
                    <span className="col-span-1 font-mono text-gray-500">{a.code}</span>
                    <span className="col-span-5 text-black">{a.name}</span>
                    <span className="col-span-3 text-right font-mono">{a.debit > 0 ? formatRand(a.debit) : ''}</span>
                    <span className="col-span-3 text-right font-mono">{a.credit > 0 ? formatRand(a.credit) : ''}</span>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 py-2 text-xs font-semibold border-t border-gray-300">
                  <span className="col-span-6 text-black">TOTAL</span>
                  <span className="col-span-3 text-right font-mono">{formatRand(position.trialBalance.reduce((s: number, a: any) => s + a.debit, 0))}</span>
                  <span className="col-span-3 text-right font-mono">{formatRand(position.trialBalance.reduce((s: number, a: any) => s + a.credit, 0))}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowExpenseForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">Record Expense</h3>
              <div className="space-y-3">
                <input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="Description *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (excl. VAT)" type="number" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input type="date" value={expForm.expense_date} onChange={e => setExpForm(f => ({ ...f, expense_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  {EXPENSE_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
                </select>
                <input value={expForm.receipt_url} onChange={e => setExpForm(f => ({ ...f, receipt_url: e.target.value }))} placeholder="Receipt URL (optional)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                {expForm.amount && (
                  <div className="bg-gray-50 rounded p-3 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between"><span>Amount:</span><span className="font-mono">{formatRand(parseFloat(expForm.amount) || 0)}</span></div>
                    <div className="flex justify-between"><span>VAT (15%):</span><span className="font-mono">{formatRand((parseFloat(expForm.amount) || 0) * 0.15)}</span></div>
                    <div className="flex justify-between font-semibold text-black"><span>Total:</span><span className="font-mono">{formatRand((parseFloat(expForm.amount) || 0) * 1.15)}</span></div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowExpenseForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleRecordExpense} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Record</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Grant Receipt Modal */}
      {showGrantForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowGrantForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">Record Grant Receipt</h3>
              <div className="space-y-3">
                <input value={grantForm.amount} onChange={e => setGrantForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount received (R)" type="number" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={grantForm.reference} onChange={e => setGrantForm(f => ({ ...f, reference: e.target.value }))} placeholder="Reference (e.g., DSAC Q1 2026)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowGrantForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleRecordGrant} className="flex-1 bg-green-700 text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-green-800">Record</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
