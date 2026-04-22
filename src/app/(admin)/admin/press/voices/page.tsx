'use client';

/**
 * /admin/press/voices — Voices list.
 *
 * Filterable by state / format / pillar. "New Voice" button to start
 * a fresh draft. Uses the legacy supabase client — admin layout has
 * already gated on auth.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type VoiceRow = {
  id: string;
  slug: string;
  format: string;
  state: string;
  title_en: string | null;
  title_xh: string | null;
  updated_at: string;
  published_at: string | null;
  scheduled_at: string | null;
};

const FORMATS = ['article','page','essay','podcast','booklet','press_release','research_note','policy_submission','call_for_submissions','announcement','sop','playbook'];
const STATES  = ['commissioned','in_progress','council_review','ready','live','archived'];

export default function VoicesListPage() {
  const [rows, setRows] = useState<VoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from('press_voices').select('id, slug, format, state, title_en, title_xh, updated_at, published_at, scheduled_at').order('updated_at', { ascending: false }).limit(200);
    if (filterState)  q = q.eq('state', filterState);
    if (filterFormat) q = q.eq('format', filterFormat);
    const { data } = await q;
    setRows((data as VoiceRow[] | null) ?? []);
    setLoading(false);
  }, [filterState, filterFormat]);

  useEffect(() => { load(); }, [load]);

  const createVoice = async () => {
    if (!supabase) return;
    setCreating(true);
    const slug = `draft-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from('press_voices').insert({
      slug,
      format: 'article',
      state: 'in_progress',
      title_en: 'Untitled',
      blocks: [],
    }).select('id, slug').single();
    setCreating(false);
    if (error || !data) {
      alert(`Could not create Voice: ${error?.message ?? 'unknown'}`);
      return;
    }
    window.location.href = `/admin/press/voices/${data.id}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <div>
          <p className="t-label">Desk · Voices</p>
          <h1 className="t-h2" style={{ marginTop: 'var(--space-2)' }}>Every format. One primitive.</h1>
          <p className="t-body" style={{ maxWidth: 520, marginTop: 'var(--space-3)' }}>
            Article · page · essay · podcast · booklet · press release · research note · policy submission · call for submissions · announcement · SOP · playbook. Same shape, different format.
          </p>
        </div>
        <button onClick={createVoice} disabled={creating} className="t-button" style={{
          background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none',
          padding: '10px 16px', cursor: 'pointer', opacity: creating ? 0.5 : 1,
        }}>
          {creating ? 'Creating' : '+ New voice'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-label" style={{ marginBottom: 4 }}>State</span>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14, minWidth: 160 }}>
            <option value="">— any —</option>
            {STATES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-label" style={{ marginBottom: 4 }}>Format</span>
          <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14, minWidth: 180 }}>
            <option value="">— any —</option>
            {FORMATS.map((f) => <option key={f} value={f}>{f.replace('_',' ')}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading Voices…</p>
      ) : rows.length === 0 ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>
          No Voices yet. Click <em>+ New voice</em> above to begin.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--border-soft)' }}>
          {rows.map((v) => (
            <li key={v.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <Link href={`/admin/press/voices/${v.id}`} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)', padding: '14px 0', textDecoration: 'none', color: 'var(--fg-1)' }}>
                <span className="t-mono" style={{ color: 'var(--fg-3)', minWidth: 140, fontSize: 12 }}>
                  {v.format.replace('_',' ')}
                </span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>
                  {v.title_en ?? v.slug}
                  {v.title_xh && <span className="t-caption" style={{ marginLeft: 'var(--space-2)', color: 'var(--fg-accent)' }}>· {v.title_xh}</span>}
                </span>
                <span className="t-label" style={{ color: stateColor(v.state) }}>{v.state.replace('_',' ')}</span>
                <span className="t-mono" style={{ color: 'var(--fg-4)', minWidth: 90, fontSize: 11, textAlign: 'right' }}>
                  {new Date(v.updated_at).toISOString().slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function stateColor(state: string): string {
  switch (state) {
    case 'live':           return 'var(--cdcc-emerald)';
    case 'ready':          return 'var(--cdcc-blue)';
    case 'council_review': return 'var(--cdcc-gold)';
    case 'archived':       return 'var(--fg-4)';
    default:               return 'var(--fg-3)';
  }
}
