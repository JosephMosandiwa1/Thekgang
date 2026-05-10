'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SOURCE_KIND_LABEL, type SourceKind, type SourceStatus } from '@/lib/sources/types';
import { upsertSource, deleteSource, setSourceStatus, type SourceInput } from './actions';

interface SourceRow {
  id: string;
  slug: string;
  label: string;
  publisher: string;
  url: string | null;
  kind: SourceKind;
  published_at: string | null;
  retrieved_at: string | null;
  notes: string | null;
  status: SourceStatus;
  added_by: string | null;
  updated_at: string;
}

const KIND_OPTIONS: SourceKind[] = ['internal', 'survey', 'masterplan', 'gazette', 'research', 'press', 'member_submission'];
const STATUS_OPTIONS: SourceStatus[] = ['draft', 'pending_verification', 'published'];

export default function AdminSourcesPage() {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SourceRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [me, setMe] = useState<string>('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase.from('sources').select('*').order('updated_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setRows((data ?? []) as SourceRow[]);
    setMe(user?.email ?? 'admin');
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(id: string | null, input: SourceInput) {
    setBusy(id ?? 'new');
    try {
      await upsertSource(id, input, me);
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(row: SourceRow) {
    if (!confirm(`Delete source "${row.label}" (${row.slug})? Facts citing it will fail to load.`)) return;
    setBusy(row.id);
    try {
      await deleteSource(row.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleStatus(row: SourceRow, status: SourceStatus) {
    setBusy(row.id);
    try {
      await setSourceStatus(row.id, status);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading sources…</div>;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-1">Setup · Sources</p>
          <h1 className="font-display text-2xl font-bold text-black">Citations registry</h1>
          <p className="text-xs text-gray-600 mt-2 max-w-2xl">
            Every fact + every image on the public site references a row here. Add a source
            after verifying its URL, publisher, and date — never seed unverified.
            Set status to <code className="px-1 bg-gray-100">published</code> to make it
            citable. <a href="/evidence" className="underline" target="_blank" rel="noreferrer">View public registry →</a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90"
        >
          + New source
        </button>
      </div>

      {creating && (
        <SourceForm
          initial={null}
          busy={busy === 'new'}
          onSave={(input) => handleSave(null, input)}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="border border-gray-200 rounded-sm overflow-hidden mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Status</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Slug · Label</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Kind</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Publisher · Date</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">URL</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/30">
                <td className="px-4 py-3 align-top">
                  <StatusChip status={row.status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-mono text-[11px] text-gray-500">{row.slug}</p>
                  <p className="text-sm font-medium">{row.label}</p>
                </td>
                <td className="px-4 py-3 align-top text-xs">{SOURCE_KIND_LABEL[row.kind]}</td>
                <td className="px-4 py-3 align-top text-xs">
                  <p>{row.publisher}</p>
                  {row.published_at && <p className="text-gray-500">{row.published_at}</p>}
                </td>
                <td className="px-4 py-3 align-top text-xs">
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px] inline-block">
                      {new URL(row.url).hostname}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">none</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <div className="flex items-center justify-end gap-2">
                    {row.status !== 'published' && (
                      <button
                        type="button"
                        disabled={busy === row.id}
                        onClick={() => handleStatus(row, 'published')}
                        className="text-[10px] uppercase tracking-wider text-emerald-700 hover:text-emerald-900 disabled:opacity-30"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() => setEditing(row)}
                      className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-black disabled:opacity-30"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy === row.id || row.slug === 'cdcc-self'}
                      onClick={() => handleDelete(row)}
                      className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Edit source</p>
              <SourceForm
                initial={editing}
                busy={busy === editing.id}
                onSave={(input) => handleSave(editing.id, input)}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: SourceStatus }) {
  const cls =
    status === 'published'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    status === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-gray-100 text-gray-600 border-gray-200';
  const label = status === 'pending_verification' ? 'pending' : status;
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${cls}`}>
      {label}
    </span>
  );
}

interface SourceFormProps {
  initial: SourceRow | null;
  busy: boolean;
  onSave: (input: SourceInput) => void;
  onCancel: () => void;
}

function SourceForm({ initial, busy, onSave, onCancel }: SourceFormProps) {
  const [form, setForm] = useState<SourceInput>({
    slug: initial?.slug ?? '',
    label: initial?.label ?? '',
    publisher: initial?.publisher ?? '',
    url: initial?.url ?? '',
    kind: initial?.kind ?? 'research',
    publishedAt: initial?.published_at ?? '',
    retrievedAt: initial?.retrieved_at ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'pending_verification',
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
    >
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Slug *">
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="pasa-2024"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Kind *">
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as SourceKind }))}
            className={inputCls}
          >
            {KIND_OPTIONS.map((k) => <option key={k} value={k}>{SOURCE_KIND_LABEL[k]}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Label *">
        <input
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="PASA Industry Survey 2024"
          required
          className={inputCls}
        />
      </Field>
      <Field label="Publisher *">
        <input
          value={form.publisher}
          onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
          placeholder="Publishers' Association of South Africa"
          required
          className={inputCls}
        />
      </Field>
      <Field label="URL (canonical link to source doc)">
        <input
          value={form.url ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="https://publishsa.co.za/industry-survey-2024"
          className={inputCls}
        />
      </Field>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Published date">
          <input
            type="date"
            value={form.publishedAt ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Last verified">
          <input
            type="date"
            value={form.retrievedAt ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, retrievedAt: e.target.value }))}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Notes (optional editorial context)">
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </Field>
      <Field label="Status">
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SourceStatus }))}
          className={inputCls}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create source'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-black px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white rounded-sm';
