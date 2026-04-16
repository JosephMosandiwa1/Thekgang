import { supabase } from '@/lib/supabase/client';

/* ============================================================
   CDCC Accounting Engine — Sage Replica
   Double-entry bookkeeping, requisitions, budget tracking.
   Mirrors VACSA's accountingEngine.ts architecture.
   ============================================================ */

// ── Chart of Accounts ──────────────────────────────────────
export const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Assets', type: 'asset', is_header: true },
  { code: '1100', name: 'Cash at Bank', type: 'asset', parent: '1000' },
  { code: '1200', name: 'Petty Cash', type: 'asset', parent: '1000' },
  { code: '1300', name: 'Prepaid Expenses', type: 'asset', parent: '1000' },
  { code: '2000', name: 'Liabilities', type: 'liability', is_header: true },
  { code: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000' },
  { code: '2200', name: 'Accrued Expenses', type: 'liability', parent: '2000' },
  { code: '3000', name: 'Equity', type: 'equity', is_header: true },
  { code: '3100', name: 'DSAC Grant Funding', type: 'equity', parent: '3000' },
  { code: '3200', name: 'Retained Surplus', type: 'equity', parent: '3000' },
  { code: '4000', name: 'Revenue', type: 'revenue', is_header: true },
  { code: '4100', name: 'DSAC Grant Income', type: 'revenue', parent: '4000' },
  { code: '4200', name: 'Sponsorship Income', type: 'revenue', parent: '4000' },
  { code: '4300', name: 'Registration Fees', type: 'revenue', parent: '4000' },
  { code: '4400', name: 'Other Income', type: 'revenue', parent: '4000' },
  { code: '5000', name: 'Programme Expenses', type: 'expense', is_header: true },
  { code: '5100', name: 'Administration / Secretariat', type: 'expense', parent: '5000' },
  { code: '5200', name: 'Board Transport & Accommodation', type: 'expense', parent: '5000' },
  { code: '5300', name: 'Office Equipment (IT & Software)', type: 'expense', parent: '5000' },
  { code: '5400', name: 'Programme / Project Implementation', type: 'expense', parent: '5000' },
  { code: '5500', name: 'Branding & Communication', type: 'expense', parent: '5000' },
  { code: '5600', name: 'Monitoring & Reporting', type: 'expense', parent: '5000' },
  { code: '5700', name: 'Official Board Meeting', type: 'expense', parent: '5000' },
  { code: '5800', name: 'Board Fees', type: 'expense', parent: '5000' },
  { code: '5900', name: 'Professional Fees', type: 'expense', parent: '5000' },
  { code: '5950', name: 'Other Expenses', type: 'expense', parent: '5000' },
];

export const BUDGET_LINES = CHART_OF_ACCOUNTS.filter(a => a.code.startsWith('5') && !a.is_header);

// ── Format helpers ─────────────────────────────────────────
export function formatRand(amount: number): string {
  return `R ${Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// ── Journal Entry Creation ─────────────────────────────────

export async function createJournalEntry(params: {
  entry_type: string;
  description: string;
  reference?: string;
  province?: string;
  lines: { account_code: string; description?: string; debit: number; credit: number }[];
}) {
  if (!supabase) return null;

  // Validate: debits must equal credits
  const totalDebit = params.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = params.lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Journal entry not balanced: Debit ${totalDebit} ≠ Credit ${totalCredit}`);
  }

  const { data: entry } = await supabase.from('journal_entries').insert({
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: params.entry_type,
    description: params.description,
    reference_type: params.reference || null,
    status: 'posted',
    posted_at: new Date().toISOString(),
  }).select('id').single();

  if (!entry) return null;

  const lines = params.lines.map(l => ({
    journal_entry_id: entry.id,
    account_code: l.account_code,
    description: l.description || params.description,
    debit: l.debit,
    credit: l.credit,
  }));

  await supabase.from('journal_entry_lines').insert(lines);
  return entry.id;
}

// ── Accrual Entry (when requisition is bank-loaded) ────────
export async function createAccrualEntry(requisitionNumber: string, supplierName: string, amount: number, expenseAccount: string) {
  return createJournalEntry({
    entry_type: 'accrual',
    description: `${requisitionNumber} — ${supplierName} (accrual)`,
    reference: requisitionNumber,
    lines: [
      { account_code: expenseAccount, debit: amount, credit: 0 },
      { account_code: '2100', debit: 0, credit: amount }, // Accounts Payable
    ],
  });
}

// ── Payment Entry (when payment is released) ───────────────
export async function createPaymentEntry(requisitionNumber: string, supplierName: string, amount: number) {
  return createJournalEntry({
    entry_type: 'payment',
    description: `${requisitionNumber} — ${supplierName} (payment)`,
    reference: requisitionNumber,
    lines: [
      { account_code: '2100', debit: amount, credit: 0 }, // Clear AP
      { account_code: '1100', debit: 0, credit: amount }, // Cash at Bank
    ],
  });
}

// ── Grant Receipt ──────────────────────────────────────────
export async function recordGrantReceipt(amount: number, reference: string) {
  return createJournalEntry({
    entry_type: 'grant_receipt',
    description: `DSAC Grant Receipt — ${reference}`,
    reference,
    lines: [
      { account_code: '1100', debit: amount, credit: 0 }, // Cash at Bank
      { account_code: '4100', debit: 0, credit: amount }, // DSAC Grant Income
    ],
  });
}

// ── Record Expense (direct, no requisition) ────────────────
export async function recordExpenseEntry(description: string, amount: number, expenseAccount: string) {
  return createJournalEntry({
    entry_type: 'expense',
    description,
    lines: [
      { account_code: expenseAccount, debit: amount, credit: 0 },
      { account_code: '1100', debit: 0, credit: amount },
    ],
  });
}

// ── Trial Balance ──────────────────────────────────────────
export async function getTrialBalance() {
  if (!supabase) return [];

  const { data: lines } = await supabase.from('journal_entry_lines').select('account_code, debit, credit');
  if (!lines) return [];

  const balances: Record<string, { debit: number; credit: number }> = {};
  for (const line of lines) {
    if (!balances[line.account_code]) balances[line.account_code] = { debit: 0, credit: 0 };
    balances[line.account_code].debit += line.debit || 0;
    balances[line.account_code].credit += line.credit || 0;
  }

  return CHART_OF_ACCOUNTS.filter(a => !a.is_header).map(account => {
    const bal = balances[account.code] || { debit: 0, credit: 0 };
    return {
      code: account.code,
      name: account.name,
      type: account.type,
      debit: bal.debit,
      credit: bal.credit,
      balance: bal.debit - bal.credit,
    };
  }).filter(a => a.debit > 0 || a.credit > 0);
}

// ── Financial Position (Income Statement) ──────────────────
export async function getFinancialPosition() {
  const tb = await getTrialBalance();
  const revenue = tb.filter(a => a.type === 'revenue').reduce((s, a) => s + a.credit - a.debit, 0);
  const expenses = tb.filter(a => a.type === 'expense').reduce((s, a) => s + a.debit - a.credit, 0);
  const assets = tb.filter(a => a.type === 'asset').reduce((s, a) => s + a.debit - a.credit, 0);
  const liabilities = tb.filter(a => a.type === 'liability').reduce((s, a) => s + a.credit - a.debit, 0);
  const equity = tb.filter(a => a.type === 'equity').reduce((s, a) => s + a.credit - a.debit, 0);

  return { revenue, expenses, netSurplus: revenue - expenses, assets, liabilities, equity, trialBalance: tb };
}

// ── Journal Entries List ───────────────────────────────────
export async function getJournalEntries(limit = 50) {
  if (!supabase) return [];
  const { data } = await supabase.from('journal_entries')
    .select('*, journal_entry_lines(*)')
    .order('entry_date', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── Budget Status ──────────────────────────────────────────
export async function getBudgetStatus() {
  if (!supabase) return [];
  const { data: budgets } = await supabase.from('budgets').select('*');
  const tb = await getTrialBalance();

  return (budgets || []).map((b: any) => {
    const spent = tb.find(a => a.code === b.account_code)?.balance || 0;
    return {
      ...b,
      spent: Math.max(0, spent),
      remaining: b.allocated_amount - Math.max(0, spent),
      utilisation: b.allocated_amount > 0 ? (Math.max(0, spent) / b.allocated_amount) * 100 : 0,
    };
  });
}

// ── Budget Availability Check ──────────────────────────────
export async function checkBudgetAvailability(budgetLine: string, amount: number) {
  const budgets = await getBudgetStatus();
  const budget = budgets.find((b: any) => b.account_code === budgetLine);
  if (!budget) return { available: false, reason: 'Budget line not found' };
  if (budget.remaining < amount) return { available: false, reason: `Insufficient budget: R${budget.remaining.toFixed(2)} remaining`, budget };
  return { available: true, budget };
}
