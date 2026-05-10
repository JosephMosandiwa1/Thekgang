'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { STYLE_LABELS, type PlacementStyle } from '@/lib/placements';
import { upsertSlot, deleteSlot, setSlotActive, type SlotInput, type SlotPosition } from './actions';

interface SlotRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  page_path: string | null;
  position: SlotPosition | null;
  page_scope: string | null;
  max_concurrent: number;
  default_style: string;
  supports_styles: string[];
  active: boolean;
  order_index: number;
  is_admin_created: boolean;
}

const POSITION_OPTIONS: SlotPosition[] = ['head', 'before_content', 'sidebar', 'between_sections', 'footer'];
const POSITION_LABEL: Record<SlotPosition, string> = {
  head: 'Head (top of page)',
  before_content: 'Before content (above first block)',
  sidebar: 'Sidebar (right rail)',
  between_sections: 'Between sections',
  footer: 'Footer (bottom of page)',
};

const KNOWN_PAGES = [
  '/', '/about', '/the-plan', '/ecosystem', '/stakeholders', '/advocacy',
  '/sector-report', '/programmes', '/events', '/jobs', '/grants',
  '/news', '/press', '/contact', '/evidence',
];

export default function AdminSlotsPage() {
  const [rows, setRows] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SlotRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('placement_slots')
      .select('*')
      .order('page_path', { ascending: true, nullsFirst: false })
      .order('order_index');
    setRows((data ?? []) as SlotRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, SlotRow[]>();
    for (const r of rows) {
      const key = r.page_path ?? '(global)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  async function handleSave(id: number | null, input: SlotInput) {
    setBusy(id ? String(id) : 'new');
    try {
      await upsertSlot(id, input);
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(row: SlotRow) {
    if (!row.is_admin_created && !confirm(`"${row.name}" is one of the original 9 seeded slots. Deleting it may break existing placements. Continue?`)) return;
    if (row.is_admin_created && !confirm(`Delete slot "${row.name}"? Live placements in this slot will be removed.`)) return;
    setBusy(String(row.id));
    try {
      await deleteSlot(row.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleActive(row: SlotRow) {
    setBusy(String(row.id));
    try {
      await setSlotActive(row.id, !row.active);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading slots…</div>;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-1">Setup · Placement slots</p>
          <h1 className="font-display text-2xl font-bold text-black">Slots — where content can be featured</h1>
          <p className="text-xs text-gray-600 mt-2 max-w-2xl">
            A slot is an admin-defined position on a public page. Pages render canonical anchors
            (<code className="px-1 bg-gray-100">head</code>, <code className="px-1 bg-gray-100">before_content</code>,
            <code className="px-1 bg-gray-100">sidebar</code>, <code className="px-1 bg-gray-100">footer</code>);
            placements created in <Link href="/admin/placements" className="underline">/admin/placements</Link> fill the slots.
            New slots light up immediately — no code edit required.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90"
        >
          + New slot
        </button>
      </div>

      {creating && (
        <SlotForm
          initial={null}
          busy={busy === 'new'}
          onSave={(input) => handleSave(null, input)}
          onCancel={() => setCreating(false)}
        />
      )}

      {grouped.map(([page, slots]) => (
        <section key={page} className="mb-8">
          <h2 className="font-display text-base font-bold text-black mb-3">
            {page === '(global)' ? 'Global · multi-page' : page}
            <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gray-500/60 font-normal">
              {slots.length} slot{slots.length === 1 ? '' : 's'}
            </span>
          </h2>
          <div className="border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Active</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Position · Slug</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Default style</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Max</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Origin</th>
                  <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/30">
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        disabled={busy === String(row.id)}
                        onClick={() => handleToggleActive(row)}
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${row.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                      >
                        {row.active ? 'live' : 'paused'}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs font-mono">{row.position ?? '—'}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm">{row.name}</p>
                      {row.description && <p className="text-[10px] text-gray-500 mt-0.5">{row.description}</p>}
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <p>{STYLE_LABELS[row.default_style as PlacementStyle] ?? row.default_style}</p>
                      <p className="text-[10px] text-gray-400">{row.supports_styles.length} allowed</p>
                    </td>
                    <td className="px-4 py-3 align-top text-right text-xs font-mono">{row.max_concurrent}</td>
                    <td className="px-4 py-3 align-top text-[10px] text-gray-500">
                      {row.is_admin_created ? 'Admin' : 'Seeded'}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy === String(row.id)}
                          onClick={() => setEditing(row)}
                          className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-black disabled:opacity-30"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={busy === String(row.id)}
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
        </section>
      ))}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Edit slot</p>
              <SlotForm
                initial={editing}
                busy={busy === String(editing.id)}
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

interface SlotFormProps {
  initial: SlotRow | null;
  busy: boolean;
  onSave: (input: SlotInput) => void;
  onCancel: () => void;
}

function SlotForm({ initial, busy, onSave, onCancel }: SlotFormProps) {
  const [form, setForm] = useState<SlotInput>({
    slug: initial?.slug ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    page_path: initial?.page_path ?? '',
    position: initial?.position ?? 'before_content',
    page_scope: initial?.page_scope ?? null,
    max_concurrent: initial?.max_concurrent ?? 1,
    default_style: initial?.default_style ?? 'callout',
    supports_styles: initial?.supports_styles ?? ['callout'],
    active: initial?.active ?? true,
    order_index: initial?.order_index ?? 100,
  });

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function toggleStyle(style: PlacementStyle) {
    setForm((f) => ({
      ...f,
      supports_styles: f.supports_styles.includes(style)
        ? f.supports_styles.filter((s) => s !== style)
        : [...f.supports_styles, style],
      default_style: f.supports_styles.includes(style) && f.default_style === style
        ? (f.supports_styles.find((s) => s !== style) ?? 'callout')
        : f.default_style,
    }));
  }

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <Field label="Name *">
        <input
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({
              ...f,
              name,
              slug: f.slug || autoSlug(name),
            }));
          }}
          placeholder="e.g. About · Sidebar callout"
          required
          className={inputCls}
        />
      </Field>
      <Field label="Slug * (auto-derived from name)">
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          required
          className={`${inputCls} font-mono`}
        />
      </Field>
      <Field label="Description">
        <input
          value={form.description ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What lives here · who creates placements for it"
          className={inputCls}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Page (URL pattern)">
          <select
            value={form.page_path ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, page_path: e.target.value || null }))}
            className={inputCls}
          >
            <option value="">— Global (any page) —</option>
            {KNOWN_PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Position (canonical anchor)">
          <select
            value={form.position ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, position: (e.target.value as SlotPosition) || null }))}
            className={inputCls}
          >
            <option value="">— Slug-keyed only —</option>
            {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{POSITION_LABEL[p]}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Max concurrent placements">
          <input
            type="number"
            min={1}
            value={form.max_concurrent}
            onChange={(e) => setForm((f) => ({ ...f, max_concurrent: Number(e.target.value) || 1 }))}
            className={inputCls}
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={form.order_index}
            onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) || 100 }))}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Allowed display styles *">
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(Object.keys(STYLE_LABELS) as PlacementStyle[]).map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.supports_styles.includes(s)}
                onChange={() => toggleStyle(s)}
              />
              <span>{STYLE_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Default style">
        <select
          value={form.default_style}
          onChange={(e) => setForm((f) => ({ ...f, default_style: e.target.value }))}
          className={inputCls}
        >
          {form.supports_styles.map((s) => (
            <option key={s} value={s}>{STYLE_LABELS[s as PlacementStyle] ?? s}</option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-2 text-xs pt-1">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
        />
        <span>Slot is active (uncheck to hide without deleting)</span>
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white text-[11px] uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-black/90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Create slot'}
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
