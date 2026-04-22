'use client';

/**
 * FormRenderer — renders an authored Form (public-facing).
 *
 * One field per row. Validation enforced client-side (required + native
 * HTML5); server-side the insert RLS enforces status=published. POST
 * to /api/press/submissions.
 */

import { FormEvent, useState } from 'react';
import type { FormDef, FormField } from '@/lib/press/forms/types';

export function FormRenderer({ form }: { form: FormDef }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending'); setError(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of form.fields) {
      if (field.type === 'checkbox') {
        payload[field.key] = fd.getAll(field.key);
      } else if (field.type === 'consent') {
        payload[field.key] = fd.get(field.key) === 'on';
      } else {
        payload[field.key] = fd.get(field.key);
      }
    }

    try {
      const res = await fetch('/api/press/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form_id: form.id, payload, source_url: window.location.href }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setStatus('ok');
      if (form.redirect_url) {
        window.location.href = form.redirect_url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  if (status === 'ok') {
    return (
      <div>
        <p className="t-card-title">{form.thankyou_en ?? 'Received.'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {form.fields.map((field) => (
        <FieldRow key={field.key} field={field} />
      ))}
      <button type="submit" disabled={status === 'sending'} className="t-button"
        style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none', padding: '12px 20px', cursor: 'pointer', marginTop: 'var(--space-3)', opacity: status === 'sending' ? 0.5 : 1 }}>
        {status === 'sending' ? 'Sending' : (form.submit_label_en ?? 'Submit')}
      </button>
      {error && <p className="t-caption" style={{ color: 'var(--cdcc-red)' }}>Could not send: {error}.</p>}
    </form>
  );
}

function FieldRow({ field }: { field: FormField }) {
  const common = {
    name: field.key,
    required: field.required,
    style: { width: '100%', padding: 10, border: '1px solid var(--border-soft)', fontSize: 14, fontFamily: 'inherit' } as const,
    placeholder: field.placeholder_en,
  };
  return (
    <label style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="t-label" style={{ marginBottom: 4 }}>{field.label_en}{field.required && <span style={{ color: 'var(--cdcc-red)', marginLeft: 4 }}>*</span>}</span>
      {field.help_en && <span className="t-caption" style={{ color: 'var(--fg-3)', marginBottom: 6 }}>{field.help_en}</span>}
      {renderFieldInput(field, common)}
    </label>
  );
}

function renderFieldInput(field: FormField, common: Record<string, unknown>) {
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={5} />;
    case 'email':
      return <input {...common} type="email" />;
    case 'phone':
      return <input {...common} type="tel" inputMode="tel" />;
    case 'number':
      return <input {...common} type="number" />;
    case 'date':
      return <input {...common} type="date" />;
    case 'datetime':
      return <input {...common} type="datetime-local" />;
    case 'select':
      return (
        <select {...common}>
          <option value="">— choose —</option>
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label_en}</option>)}
        </select>
      );
    case 'multi_select':
      return (
        <select {...common} multiple size={Math.min(6, (field.options ?? []).length)}>
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label_en}</option>)}
        </select>
      );
    case 'radio':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(field.options ?? []).map((o) => (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="radio" name={field.key} value={o.value} required={field.required} />
              {o.label_en}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(field.options ?? []).map((o) => (
            <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input type="checkbox" name={field.key} value={o.value} />
              {o.label_en}
            </label>
          ))}
        </div>
      );
    case 'file_upload':
      return <input {...common} type="file" />;
    case 'consent':
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" name={field.key} required={field.required} />
          <span>{field.label_en}</span>
        </label>
      );
    case 'discipline_picker':
    case 'pillar_picker':
    case 'province_picker':
    case 'language_picker':
    case 'council_member_picker':
      // These will become live-loaded selects once the public data APIs land (Phase F11).
      return <input {...common} type="text" placeholder={`${field.type.replace('_', ' ')} (type value for now)`} />;
    case 'signature':
      return <input {...common} type="text" placeholder="Type your full name to sign" />;
    case 'text':
    default:
      return <input {...common} type="text" />;
  }
}
