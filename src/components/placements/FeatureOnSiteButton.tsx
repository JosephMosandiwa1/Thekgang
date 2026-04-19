'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { supabaseErrorMessage } from '@/lib/utils';
import { CONTENT_KIND_LABELS, STYLE_LABELS, type ContentKind, type PlacementStyle } from '@/lib/placements';

interface Slot { id: number; slug: string; name: string; description: string | null; supports_styles: string[]; default_style: string; page_scope: string }

interface Props {
  contentKind: ContentKind;
  refId: number;
  contentTitle: string;
  /** Optional: override the button label */
  label?: string;
  /** Optional: additional classes on the trigger button */
  className?: string;
}

/**
 * Drop-in button for any admin page. Opens a modal pre-filled for the given
 * content, asks for slot + style + schedule, inserts a placement row.
 *
 *   <FeatureOnSiteButton contentKind="event" refId={event.id} contentTitle={event.title} />
 */
export function FeatureOnSiteButton({ contentKind, refId, contentTitle, label, className }: Props) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState({
    slot_id: 0,
    style: 'card' as PlacementStyle,
    theme: 'light' as 'light' | 'dark' | 'brand' | 'paper' | 'accent',
    priority: 100,
    starts_at: '',
    ends_at: '',
    status: 'live' as 'draft' | 'scheduled' | 'live',
    override_eyebrow: '',
    override_title: '',
    override_subtitle: '',
    override_cta_text: '',
    override_cta_url: '',
    frequency: 'session' as 'once' | 'daily' | 'session' | 'always',
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('placement_slots').select('*').eq('active', true).order('order_index');
      const rows = (data || []) as Slot[];
      setSlots(rows);
      if (!form.slot_id && rows.length > 0) {
        setForm((f) => ({ ...f, slot_id: rows[0].id, style: (rows[0].default_style || rows[0].supports_styles[0] || 'card') as PlacementStyle }));
      }
      setLoading(false);
    })();
  }, [open, form.slot_id]);

  async function save() {
    if (!supabase || !form.slot_id) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('placements').insert({
      slot_id: form.slot_id,
      content_kind: contentKind,
      ref_id: refId,
      style: form.style,
      theme: form.theme,
      priority: form.priority,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      status: form.status,
      frequency: form.frequency,
      override_eyebrow: form.override_eyebrow || null,
      override_title: form.override_title || null,
      override_subtitle: form.override_subtitle || null,
      override_cta_text: form.override_cta_text || null,
      override_cta_url: form.override_cta_url || null,
    });
    if (error) setMessage({ kind: 'err', text: supabaseErrorMessage(error) });
    else { setMessage({ kind: 'ok', text: 'Placed ✓' }); setTimeout(() => { setOpen(false); setMessage(null); }, 1100); }
    setSaving(false);
  }

  const currentSlot = slots.find((s) => s.id === form.slot_id);
  const availableStyles = (currentSlot?.supports_styles || Object.keys(STYLE_LABELS)) as PlacementStyle[];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors'}
      >
        {label || '+ Feature on site'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => !saving && setOpen(false)}>
          <div className="bg-white max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">Feature on public site</p>
            <h3 className="font-display text-xl font-bold mb-1">{contentTitle}</h3>
            <p className="text-xs text-gray-500 mb-5">{CONTENT_KIND_LABELS[contentKind]}</p>

            {loading ? <p className="text-sm text-gray-500">Loading slots…</p> : (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Where · placement slot</span>
                  <select
                    value={form.slot_id}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const s = slots.find((x) => x.id === id);
                      setForm({ ...form, slot_id: id, style: (s?.default_style || 'card') as PlacementStyle });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 text-sm"
                  >
                    {slots.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}{s.page_scope && ` — ${s.page_scope}`}</option>
                    ))}
                  </select>
                  {currentSlot?.description && <p className="text-[10px] text-gray-500 mt-1">{currentSlot.description}</p>}
                </label>

                <div className="grid md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Display style</span>
                    <select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value as PlacementStyle })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                      {availableStyles.map((s) => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Theme</span>
                    <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as typeof form.theme })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                      <option value="light">Light</option><option value="dark">Dark</option><option value="brand">Brand</option><option value="paper">Paper</option><option value="accent">Accent</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Priority</span>
                    <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                  </label>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Starts</span>
                    <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Ends</span>
                    <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Status</span>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                      <option value="live">Live now</option><option value="scheduled">Scheduled</option><option value="draft">Draft</option>
                    </select>
                  </label>
                </div>

                {form.style === 'modal' && (
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Show frequency</span>
                    <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as typeof form.frequency })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                      <option value="once">Once per user</option>
                      <option value="session">Once per session</option>
                      <option value="daily">Once per day</option>
                      <option value="always">Every page load</option>
                    </select>
                  </label>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-gray-600 hover:text-black">Override content (optional)</summary>
                  <div className="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                    <input placeholder="Override eyebrow" value={form.override_eyebrow} onChange={(e) => setForm({ ...form, override_eyebrow: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                    <input placeholder="Override title" value={form.override_title} onChange={(e) => setForm({ ...form, override_title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                    <input placeholder="Override subtitle" value={form.override_subtitle} onChange={(e) => setForm({ ...form, override_subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                    <input placeholder="Override CTA text" value={form.override_cta_text} onChange={(e) => setForm({ ...form, override_cta_text: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                    <input placeholder="Override CTA URL" value={form.override_cta_url} onChange={(e) => setForm({ ...form, override_cta_url: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                  </div>
                </details>

                {message && <div className={`p-3 text-sm border ${message.kind === 'ok' ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>}

                <div className="flex gap-3 mt-4">
                  <button onClick={save} disabled={saving || !form.slot_id} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 disabled:opacity-50">{saving ? 'Placing…' : 'Place on site'}</button>
                  <button onClick={() => setOpen(false)} disabled={saving} className="text-xs text-gray-500 hover:text-black">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
