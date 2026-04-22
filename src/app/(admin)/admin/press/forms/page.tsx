'use client';

/**
 * /admin/press/forms — Forms list.
 *
 * All Forms, sorted by status + updated_at. Click to edit.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type FormRow = {
  id: string; slug: string; title_en: string; status: string;
  access: string; updated_at: string; opens_at: string | null; closes_at: string | null;
};

export default function FormsListPage() {
  const [rows, setRows] = useState<FormRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('press_forms').select('id, slug, title_en, status, access, updated_at, opens_at, closes_at').order('updated_at', { ascending: false });
    setRows((data as FormRow[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createForm = async () => {
    if (!supabase) return;
    const slug = `form-${Date.now().toString(36)}`;
    const { data } = await supabase.from('press_forms').insert({
      slug,
      title_en: 'Untitled form',
      fields: [],
      access: 'public',
      status: 'draft',
    }).select('id').single();
    if (data) window.location.href = `/admin/press/forms/${data.id}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <div>
          <p className="t-label">Desk · Forms</p>
          <h1 className="t-h2" style={{ marginTop: 'var(--space-2)' }}>Authored, not coded.</h1>
          <p className="t-body" style={{ maxWidth: 560, marginTop: 'var(--space-3)' }}>
            Event registration · membership · call-for-submissions · grant applications · feedback · RSVP · survey. Any Form, bilingual, with role-based routing and scheduled open/close windows.
          </p>
        </div>
        <button onClick={createForm} className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none', padding: '10px 16px', cursor: 'pointer' }}>
          + New form
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <Link href="/admin/press/forms/inbox" className="t-button" style={{ border: '1px solid var(--cdcc-charcoal)', color: 'var(--fg-1)', padding: '8px 14px', textDecoration: 'none' }}>
          Submissions inbox →
        </Link>
      </div>

      {loading ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading Forms…</p>
      ) : rows.length === 0 ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>No Forms yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--border-soft)' }}>
          {rows.map((f) => (
            <li key={f.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <Link href={`/admin/press/forms/${f.id}`} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4) 0', textDecoration: 'none', color: 'var(--fg-1)' }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{f.title_en}</span>
                <span className="t-mono" style={{ color: 'var(--fg-3)', fontSize: 11, minWidth: 160 }}>{f.slug}</span>
                <span className="t-label" style={{ color: f.access === 'public' ? 'var(--cdcc-emerald)' : 'var(--fg-accent)' }}>{f.access.replace('_', ' ')}</span>
                <span className="t-label" style={{ color: f.status === 'published' ? 'var(--cdcc-emerald)' : 'var(--fg-4)' }}>{f.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
