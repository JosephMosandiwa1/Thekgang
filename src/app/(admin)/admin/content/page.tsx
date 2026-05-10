'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { SourceStatus } from '@/lib/sources/types';
import { upsertFact, deleteFact, setFactStatus, type FactInput } from './actions';

interface FactRow {
  id: string;
  surface: string;
  position: number;
  value: string;
  label: string;
  why_here: string | null;
  context: string | null;
  source_id: string;
  href: string;
  status: SourceStatus;
  is_active: boolean;
  updated_at: string;
}

interface SourceOption {
  id: string;
  slug: string;
  label: string;
  status: SourceStatus;
}

const STATUS_OPTIONS: SourceStatus[] = ['draft', 'pending_verification', 'published'];

export default function AdminContentPage() {
  const [facts, setFacts] = useState<FactRow[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FactRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filterSurface, setFilterSurface] = useState<string>('');

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: factData }, { data: sourceData }] = await Promise.all([
      supabase.from('content_facts').select('*').order('surface').order('position'),
      supabase.from('sources').select('id, slug, label, status').order('label'),
    ]);
    setFacts((factData ?? []) as FactRow[]);
    setSources((sourceData ?? []) as SourceOption[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const surfaces = useMemo(() => Array.from(new Set(facts.map((f) => f.surface))).sort(), [facts]);
  const filtered = filterSurface ? facts.filter((f) => f.surface === filterSurface) : facts;

  async function handleSave(id: string | null, input: FactInput) {
    setBusy(id ?? 'new');
    try {
      await upsertFact(id, input);
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(row: FactRow) {
    if (!confirm(`Delete fact "${row.value}" from ${row.surface}?`)) return;
    setBusy(row.id);
    try {
      await deleteFact(row.id);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish(row: FactRow) {
    setBusy(row.id);
    try {
      await setFactStatus(row.id, 'published');
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading facts…</div>;

  const publishedSources = sources.filter((s) => s.status === 'published');

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-1">Setup · Content facts</p>
          <h1 className="font-display text-2xl font-bold text-black">Marketing-page facts</h1>
          <p className="text-xs text-gray-600 mt-2 max-w-2xl">
            Every public-facing stat, claim, or numbered figure is a row here.
            Each fact must reference a published source and carry a doorway href —
            those rules are enforced by the database. Add a fact, pick a surface
            (e.g. <code className="px-1 bg-gray-100">homepage.social_proof</code>),
            and it appears on the corresponding page when status is <code className="px-1 bg-gray-100">published</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={publishedSources.length === 0}
          title={publishedSources.length === 0 ? 'Add and publish at least one source first' : ''}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90 disabled:opacity-40"
        >
          + New fact
        </button>
      </div>

      {publishedSources.length === 0 && (
        <div className="border border-amber-300/50 bg-amber-50 px-4 py-3 rounded text-xs text-amber-900 mb-4">
          No published sources yet. <a href="/admin/sources" className="underline">Add one →</a> before authoring facts.
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Filter</label>
        <select
          value={filterSurface}
          onChange={(e) => setFilterSurface(e.target.value)}
          className="border border-gray-200 px-2 py-1 text-xs rounded-sm"
        >
          <option value="">All surfaces ({facts.length})</option>
          {surfaces.map((s) => (
            <option key={s} value={s}>{s} ({facts.filter((f) => f.surface === s).length})</option>
          ))}
        </select>
      </div>

      {creating && (
        <FactForm
          initial={null}
          sources={publishedSources}
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
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Surface · Position</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Value · Label</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Source</th>
              <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Href</th>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const src = sources.find((s) => s.id === row.source_id);
              return (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/30">
                  <td className="px-4 py-3 align-top"><StatusChip status={row.status} active={row.is_active} /></td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-mono text-[11px] text-gray-500">{row.surface}</p>
                    <p className="text-[10px] text-gray-400">#{row.position}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium" style={{ color: 'var(--cdcc-gold, #C5A15A)' }}>{row.value}</p>
                    <p className="text-xs text-gray-700">{row.label}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {src ? (
                      <span className="font-mono text-[11px]">{src.slug}</span>
                    ) : (
                      <span className="text-red-600">missing</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs font-mono text-gray-500">{row.href}</td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      {row.status !== 'published' && (
                        <button
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => handlePublish(row)}
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
                        disabled={busy === row.id}
                        onClick={() => handleDelete(row)}
                        className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">No facts in this surface.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Edit fact</p>
              <FactForm
                initial={editing}
                sources={publishedSources}
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

function StatusChip({ status, active }: { status: SourceStatus; active: boolean }) {
  if (!active) {
    return <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded bg-gray-100 text-gray-500 border-gray-200">archived</span>;
  }
  const cls =
    status === 'published'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    status === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-gray-100 text-gray-600 border-gray-200';
  const label = status === 'pending_verification' ? 'pending' : status;
  return <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${cls}`}>{label}</span>;
}

interface FactFormProps {
  initial: FactRow | null;
  sources: SourceOption[];
  busy: boolean;
  onSave: (input: FactInput) => void;
  onCancel: () => void;
}

function FactForm({ initial, sources, busy, onSave, onCancel }: FactFormProps) {
  const [form, setForm] = useState<FactInput>({
    surface: initial?.surface ?? 'homepage.social_proof',
    position: initial?.position ?? 0,
    value: initial?.value ?? '',
    label: initial?.label ?? '',
    whyHere: initial?.why_here ?? '',
    context: initial?.context ?? '',
    sourceId: initial?.source_id ?? sources[0]?.id ?? '',
    href: initial?.href ?? '/',
    status: initial?.status ?? 'draft',
    isActive: initial?.is_active ?? true,
  });

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Surface key *">
          <input
            value={form.surface}
            onChange={(e) => setForm((f) => ({ ...f, surface: e.target.value }))}
            placeholder="homepage.social_proof"
            required
            className={`${inputCls} font-mono`}
          />
        </Field>
        <Field label="Position">
          <input
            type="number"
            min={0}
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) || 0 }))}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Value * (the headline number/claim)">
          <input
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="14 or R5.6B or 30 March 2026"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Label *">
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Disciplines"
            required
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Why-here (optional · one line explaining why this fact appears in this section)">
        <input
          value={form.whyHere ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, whyHere: e.target.value }))}
          className={inputCls}
        />
      </Field>
      <Field label="Context (optional · revealed on hover)">
        <textarea
          value={form.context ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Source * (from /admin/sources)">
          <select
            value={form.sourceId}
            onChange={(e) => setForm((f) => ({ ...f, sourceId: e.target.value }))}
            required
            className={inputCls}
          >
            {sources.length === 0 && <option value="">No published sources</option>}
            {sources.map((s) => <option key={s.id} value={s.id}>{s.slug} · {s.label}</option>)}
          </select>
        </Field>
        <Field label="Doorway href *">
          <input
            value={form.href}
            onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
            placeholder="/the-plan"
            required
            className={`${inputCls} font-mono`}
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-3 items-end">
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SourceStatus }))}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-xs pb-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          <span>Active (uncheck to archive without deleting)</span>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create fact'}
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
