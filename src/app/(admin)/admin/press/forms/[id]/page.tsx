'use client';

/**
 * /admin/press/forms/[id] — Form builder.
 *
 * Edit fields inline. Drag up/down. Toggle required. Bilingual labels.
 * Access + schedule + submit label + thank-you message. Publish to
 * make it submittable at /f/[slug].
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FIELD_TYPES, newField, type FormDef, type FormField, type FieldType } from '@/lib/press/forms/types';

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDef | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !id) return;
    const { data } = await supabase.from('press_forms').select('*').eq('id', id).single();
    if (data) setForm(data as unknown as FormDef);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = (m: (f: FormDef) => FormDef) => {
    setForm((prev) => (prev ? m(prev) : prev));
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void save(); }, 1000);
  };

  const save = async () => {
    if (!supabase || !form) return;
    setSaving(true);
    const { error } = await supabase.from('press_forms').update({
      slug: form.slug,
      title_en: form.title_en,
      title_xh: form.title_xh,
      description_en: form.description_en,
      description_xh: form.description_xh,
      fields: form.fields,
      access: form.access,
      programme_id: form.programme_id,
      campaign_id: form.campaign_id,
      opens_at: form.opens_at,
      closes_at: form.closes_at,
      submit_label_en: form.submit_label_en,
      submit_label_xh: form.submit_label_xh,
      thankyou_en: form.thankyou_en,
      thankyou_xh: form.thankyou_xh,
      redirect_url: form.redirect_url,
      status: form.status,
    }).eq('id', form.id);
    setSaving(false);
    if (error) { setMessage(`Save error: ${error.message}`); return; }
    setDirty(false);
    setMessage('Saved.');
    setTimeout(() => setMessage(null), 1500);
  };

  const addField = (type: FieldType) => {
    patch((f) => ({ ...f, fields: [...f.fields, newField(type)] }));
    setPickerOpen(false);
  };

  const moveField = (idx: number, direction: -1 | 1) => {
    patch((f) => {
      const next = [...f.fields];
      const swap = idx + direction;
      if (swap < 0 || swap >= next.length) return f;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return { ...f, fields: next };
    });
  };

  const updateField = (idx: number, m: (field: FormField) => FormField) => {
    patch((f) => ({ ...f, fields: f.fields.map((x, i) => i === idx ? m(x) : x) }));
  };

  const removeField = (idx: number) => {
    patch((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }));
  };

  if (!form) return <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading…</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'var(--space-7)', alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Link href="/admin/press/forms" className="t-label" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>← Forms</Link>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--space-4)' }}>
          <label>
            <span className="t-label">Title · EN</span>
            <input value={form.title_en} onChange={(e) => patch((f) => ({ ...f, title_en: e.target.value }))} style={{ width: '100%', padding: 10, border: '1px solid var(--border-soft)', fontSize: 18, fontWeight: 600, marginTop: 4 }} />
          </label>
          <label>
            <span className="t-label" style={{ color: 'var(--fg-accent)' }}>Title · XH</span>
            <input value={form.title_xh ?? ''} onChange={(e) => patch((f) => ({ ...f, title_xh: e.target.value }))} style={{ width: '100%', padding: 10, border: '1px solid var(--border-gold-soft)', fontSize: 18, fontWeight: 600, marginTop: 4, background: 'var(--bg-2)' }} />
          </label>
        </div>

        <h2 className="t-h3" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>Fields ({form.fields.length})</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {form.fields.map((field, idx) => (
            <div key={field.key} style={{ border: '1px solid var(--border-soft)', padding: 'var(--space-4)', background: 'var(--bg-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span className="t-label">{field.type.replace('_', ' ')}</span>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  <BtnSm onClick={() => moveField(idx, -1)}>↑</BtnSm>
                  <BtnSm onClick={() => moveField(idx, 1)}>↓</BtnSm>
                  <BtnSm danger onClick={() => removeField(idx)}>×</BtnSm>
                </span>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: '1fr 1fr' }}>
                <label>
                  <span className="t-label">Label · EN</span>
                  <input value={field.label_en} onChange={(e) => updateField(idx, (ff) => ({ ...ff, label_en: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14, marginTop: 4 }} />
                </label>
                <label>
                  <span className="t-label" style={{ color: 'var(--fg-accent)' }}>Label · XH</span>
                  <input value={field.label_xh ?? ''} onChange={(e) => updateField(idx, (ff) => ({ ...ff, label_xh: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-gold-soft)', fontSize: 14, marginTop: 4, background: 'var(--bg-2)' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: '1fr 1fr 140px', marginTop: 'var(--space-3)' }}>
                <label>
                  <span className="t-label">Field key</span>
                  <input value={field.key} onChange={(e) => updateField(idx, (ff) => ({ ...ff, key: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4 }} />
                </label>
                <label>
                  <span className="t-label">Help text · EN</span>
                  <input value={field.help_en ?? ''} onChange={(e) => updateField(idx, (ff) => ({ ...ff, help_en: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, marginTop: 4 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="t-label">Required</span>
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, (ff) => ({ ...ff, required: e.target.checked }))} style={{ marginTop: 8 }} />
                </label>
              </div>

              {(field.type === 'select' || field.type === 'multi_select' || field.type === 'radio' || field.type === 'checkbox') && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span className="t-label">Options · one per line · format: value|label</span>
                  <textarea
                    rows={4}
                    value={(field.options ?? []).map((o) => `${o.value}|${o.label_en}`).join('\n')}
                    onChange={(e) => updateField(idx, (ff) => ({
                      ...ff,
                      options: e.target.value.split('\n').filter(Boolean).map((line) => {
                        const [value, label] = line.split('|');
                        return { value: value?.trim() ?? '', label_en: (label ?? value ?? '').trim() };
                      }),
                    }))}
                    style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4 }}
                  />
                </div>
              )}
            </div>
          ))}

          <div>
            {!pickerOpen ? (
              <button type="button" onClick={() => setPickerOpen(true)} className="t-label"
                style={{ background: 'transparent', border: '1px dashed var(--border-soft)', padding: '8px 14px', color: 'var(--fg-3)', cursor: 'pointer' }}>
                + add field
              </button>
            ) : (
              <div style={{ border: '1px solid var(--border-gold-soft)', background: 'var(--bg-2)', padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {FIELD_TYPES.map((ft) => (
                  <button key={ft.type} type="button" onClick={() => addField(ft.type)}
                    style={{ background: 'var(--bg-1)', border: '1px solid var(--border-soft)', padding: 'var(--space-3)', textAlign: 'left', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ft.label}</div>
                    <div className="t-caption" style={{ marginTop: 2 }}>{ft.hint}</div>
                  </button>
                ))}
                <button type="button" onClick={() => setPickerOpen(false)} className="t-button" style={{ background: 'transparent', border: '1px solid var(--cdcc-charcoal)', padding: 'var(--space-2)', gridColumn: '1 / -1' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        <h2 className="t-h3" style={{ marginTop: 'var(--space-7)', marginBottom: 'var(--space-3)' }}>Behaviour</h2>
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <span className="t-label">Submit label · EN</span>
            <input value={form.submit_label_en ?? 'Submit'} onChange={(e) => patch((f) => ({ ...f, submit_label_en: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, marginTop: 4 }} />
          </label>
          <label>
            <span className="t-label">Redirect URL (optional)</span>
            <input value={form.redirect_url ?? ''} onChange={(e) => patch((f) => ({ ...f, redirect_url: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, marginTop: 4 }} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span className="t-label">Thank-you message · EN</span>
            <textarea rows={2} value={form.thankyou_en ?? ''} onChange={(e) => patch((f) => ({ ...f, thankyou_en: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, marginTop: 4 }} />
          </label>
        </div>
      </div>

      <aside style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: 'var(--space-6)', position: 'sticky', top: 72 }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">Status</p>
          <select value={form.status} onChange={(e) => patch((f) => ({ ...f, status: e.target.value as FormDef['status'] }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, marginTop: 4 }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">Access</p>
          <select value={form.access} onChange={(e) => patch((f) => ({ ...f, access: e.target.value as FormDef['access'] }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, marginTop: 4 }}>
            <option value="public">Public</option>
            <option value="member">Member-only</option>
            <option value="programme_scoped">Programme-scoped</option>
            <option value="token_gated">Token-gated</option>
          </select>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">Slug</p>
          <input value={form.slug} onChange={(e) => patch((f) => ({ ...f, slug: e.target.value }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4 }} />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">Opens at</p>
          <input type="datetime-local" value={form.opens_at ? form.opens_at.slice(0, 16) : ''}
            onChange={(e) => patch((f) => ({ ...f, opens_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, marginTop: 4 }} />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">Closes at</p>
          <input type="datetime-local" value={form.closes_at ? form.closes_at.slice(0, 16) : ''}
            onChange={(e) => patch((f) => ({ ...f, closes_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 12, marginTop: 4 }} />
        </div>

        {form.status === 'published' && (
          <a href={`/f/${form.slug}`} target="_blank" rel="noreferrer" className="t-button"
            style={{ display: 'block', textAlign: 'center', padding: '8px 12px', border: '1px solid var(--cdcc-charcoal)', color: 'var(--fg-1)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}>
            Open public form →
          </a>
        )}

        <div className="t-caption" style={{ color: saving ? 'var(--fg-accent)' : dirty ? 'var(--cdcc-amber)' : 'var(--fg-3)' }}>
          {saving ? 'Saving…' : dirty ? 'Unsaved' : (message ?? 'Saved.')}
        </div>
      </aside>
    </div>
  );
}

function BtnSm({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ width: 28, height: 28, background: 'var(--bg-1)', border: '1px solid var(--border-soft)', color: danger ? 'var(--cdcc-red)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 13 }}>
      {children}
    </button>
  );
}
