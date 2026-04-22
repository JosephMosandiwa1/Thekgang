'use client';

/**
 * /admin/press/forms/inbox — submissions review.
 *
 * Unified inbox across every Form. Filters: form, state, date.
 * Click a submission to expand the payload + change state.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Submission = {
  id: string;
  form_id: string;
  state: string;
  submitter_email: string | null;
  submitter_name: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};
type FormLite = { id: string; title_en: string; slug: string };

const STATES = ['received', 'reviewing', 'shortlisted', 'accepted', 'declined', 'notified', 'withdrawn'];
const NEXT: Record<string, string[]> = {
  received:   ['reviewing', 'withdrawn'],
  reviewing:  ['shortlisted', 'accepted', 'declined'],
  shortlisted:['accepted', 'declined'],
  accepted:   ['notified'],
  declined:   ['notified'],
  notified:   [],
  withdrawn:  [],
};

export default function InboxPage() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [forms, setForms] = useState<FormLite[]>([]);
  const [filterForm, setFilterForm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('press_submissions').select('*').order('created_at', { ascending: false }).limit(200);
    if (filterForm) q = q.eq('form_id', filterForm);
    if (filterState) q = q.eq('state', filterState);
    const [{ data: s }, { data: f }] = await Promise.all([q, supabase.from('press_forms').select('id, title_en, slug').order('title_en')]);
    setRows((s as Submission[]) ?? []);
    setForms((f as FormLite[]) ?? []);
    setLoading(false);
  }, [filterForm, filterState]);

  useEffect(() => { load(); }, [load]);

  const formName = useCallback((id: string) => forms.find((f) => f.id === id)?.title_en ?? id.slice(0, 8), [forms]);

  const transition = async (submissionId: string, toState: string) => {
    if (!supabase) return;
    await supabase.from('press_submissions').update({ state: toState, decided_at: ['accepted', 'declined', 'notified'].includes(toState) ? new Date().toISOString() : null }).eq('id', submissionId);
    load();
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Link href="/admin/press/forms" className="t-label" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>← Forms</Link>
      </div>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <p className="t-label">Desk · Forms · Inbox</p>
        <h1 className="t-h2" style={{ marginTop: 'var(--space-2)' }}>Submissions ({rows.length})</h1>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-label">Form</span>
          <select value={filterForm} onChange={(e) => setFilterForm(e.target.value)} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, minWidth: 200, marginTop: 4 }}>
            <option value="">— all —</option>
            {forms.map((f) => <option key={f.id} value={f.id}>{f.title_en}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-label">State</span>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, minWidth: 150, marginTop: 4 }}>
            <option value="">— any —</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading Inbox…</p>
      ) : rows.length === 0 ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>No submissions match.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--border-soft)' }}>
          {rows.map((s) => {
            const open = openId === s.id;
            return (
              <li key={s.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <button onClick={() => setOpenId(open ? null : s.id)} style={{ display: 'flex', gap: 'var(--space-4)', width: '100%', background: 'transparent', border: 'none', padding: 'var(--space-4) 0', cursor: 'pointer', textAlign: 'left', color: 'var(--fg-1)' }}>
                  <span className="t-label" style={{ minWidth: 160 }}>{formName(s.form_id)}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{s.submitter_name ?? s.submitter_email ?? '(anonymous)'}</span>
                  <span className="t-caption" style={{ color: 'var(--fg-3)', minWidth: 180 }}>{s.submitter_email}</span>
                  <span className="t-label" style={{ color: stateColor(s.state), minWidth: 80 }}>{s.state}</span>
                  <span className="t-mono" style={{ color: 'var(--fg-4)', fontSize: 11 }}>{new Date(s.created_at).toISOString().slice(0, 10)}</span>
                </button>
                {open && (
                  <div style={{ padding: 'var(--space-4)', background: 'var(--bg-2)', marginBottom: 'var(--space-3)' }}>
                    <pre className="t-mono" style={{ fontSize: 12, background: 'var(--bg-1)', padding: 'var(--space-3)', overflow: 'auto', margin: 0 }}>
                      {JSON.stringify(s.payload, null, 2)}
                    </pre>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                      {(NEXT[s.state] ?? []).map((next) => (
                        <button key={next} onClick={() => transition(s.id, next)} className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>
                          → {next}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function stateColor(state: string): string {
  switch (state) {
    case 'received':    return 'var(--fg-3)';
    case 'reviewing':   return 'var(--cdcc-gold)';
    case 'shortlisted': return 'var(--cdcc-blue)';
    case 'accepted':    return 'var(--cdcc-emerald)';
    case 'declined':    return 'var(--cdcc-red)';
    case 'notified':    return 'var(--fg-2)';
    default:            return 'var(--fg-4)';
  }
}
