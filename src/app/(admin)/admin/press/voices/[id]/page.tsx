'use client';

/**
 * /admin/press/voices/[id] — Voice editor.
 *
 * Left column: bilingual title + standfirst + block stream editor.
 * Right rail: state machine + format + taxonomy + schedule + preview link.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { VoiceEditor } from '@/components/press/VoiceEditor';
import type { Block } from '@/lib/press/blocks/types';

type Voice = {
  id: string;
  slug: string;
  format: string;
  state: string;
  title_en: string | null;
  title_xh: string | null;
  standfirst_en: string | null;
  standfirst_xh: string | null;
  blocks: Block[];
  pillar_id: string | null;
  discipline_ids: string[] | null;
  campaign_id: string | null;
  tags: string[] | null;
  scheduled_at: string | null;
  published_at: string | null;
  preview_token: string | null;
  seo_title_en: string | null;
  seo_description_en: string | null;
  social_image_url: string | null;
  print_included: boolean;
};

type Pillar = { id: string; slug: string; label_en: string };
type Discipline = { id: string; slug: string; label_en: string };

const FORMATS = ['article','page','essay','podcast','booklet','press_release','research_note','policy_submission','call_for_submissions','announcement','sop','playbook'];
const NEXT_STATE: Record<string, string[]> = {
  commissioned:   ['in_progress'],
  in_progress:    ['council_review', 'commissioned'],
  council_review: ['in_progress', 'ready'],
  ready:          ['live', 'council_review'],
  live:           ['archived'],
  archived:       ['live'],
};

export default function VoiceEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [voice, setVoice] = useState<Voice | null>(null);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !id) return;
    const [{ data: v }, { data: p }, { data: d }] = await Promise.all([
      supabase.from('press_voices').select('*').eq('id', id).single(),
      supabase.from('press_pillars').select('id, slug, label_en').order('sort_order'),
      supabase.from('press_disciplines').select('id, slug, label_en').order('sort_order'),
    ]);
    if (v) setVoice(v as unknown as Voice);
    if (p) setPillars(p as Pillar[]);
    if (d) setDisciplines(d as Discipline[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = (mutator: (v: Voice) => Voice) => {
    setVoice((prev) => (prev ? mutator(prev) : prev));
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void save(); }, 1200);
  };

  const save = async () => {
    if (!supabase || !voice) return;
    setSaving(true); setErr(null);
    const { blocks, title_en, title_xh, standfirst_en, standfirst_xh, format, pillar_id, discipline_ids, tags, scheduled_at, seo_title_en, seo_description_en, social_image_url, print_included, slug } = voice;
    const { error } = await supabase.from('press_voices').update({
      blocks, title_en, title_xh, standfirst_en, standfirst_xh, format, pillar_id, discipline_ids, tags, scheduled_at,
      seo_title_en, seo_description_en, social_image_url, print_included, slug,
    }).eq('id', voice.id);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setDirty(false);
    setMessage('Saved.');
    setTimeout(() => setMessage(null), 1500);
  };

  const transition = async (toState: string) => {
    if (!supabase || !voice) return;
    await save();
    const { error } = await supabase.from('press_voices').update({ state: toState }).eq('id', voice.id);
    if (error) { setErr(error.message); return; }
    setVoice({ ...voice, state: toState });
    setMessage(`Moved to ${toState.replace('_', ' ')}.`);
    setTimeout(() => setMessage(null), 2500);
  };

  const remove = async () => {
    if (!supabase || !voice) return;
    if (!confirm('Delete this Voice? This cannot be undone.')) return;
    await supabase.from('press_voices').delete().eq('id', voice.id);
    router.push('/admin/press/voices');
  };

  const previewHref = useMemo(() => voice?.preview_token ? `/preview/${voice.preview_token}` : null, [voice?.preview_token]);

  if (!voice) return <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading…</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'var(--space-7)', alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Link href="/admin/press/voices" className="t-label" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>← Voices</Link>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Title · EN</span>
            <input value={voice.title_en ?? ''} onChange={(e) => patch((v) => ({ ...v, title_en: e.target.value }))} style={{ padding: 10, border: '1px solid var(--border-soft)', fontSize: 20, fontWeight: 600 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4, color: 'var(--fg-accent)' }}>Title · XH</span>
            <input value={voice.title_xh ?? ''} onChange={(e) => patch((v) => ({ ...v, title_xh: e.target.value }))} style={{ padding: 10, border: '1px solid var(--border-gold-soft)', fontSize: 20, fontWeight: 600, background: 'var(--bg-2)' }} />
          </label>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--space-6)' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Standfirst · EN</span>
            <textarea value={voice.standfirst_en ?? ''} onChange={(e) => patch((v) => ({ ...v, standfirst_en: e.target.value }))} rows={3} style={{ padding: 10, border: '1px solid var(--border-soft)', fontSize: 14, fontFamily: 'inherit' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4, color: 'var(--fg-accent)' }}>Standfirst · XH</span>
            <textarea value={voice.standfirst_xh ?? ''} onChange={(e) => patch((v) => ({ ...v, standfirst_xh: e.target.value }))} rows={3} style={{ padding: 10, border: '1px solid var(--border-gold-soft)', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg-2)' }} />
          </label>
        </div>

        <VoiceEditor value={voice.blocks ?? []} onChange={(blocks) => patch((v) => ({ ...v, blocks }))} />
      </div>

      <aside style={{ borderLeft: '1px solid var(--border-soft)', paddingLeft: 'var(--space-6)', position: 'sticky', top: 72, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label">State</p>
          <p className="t-card-title" style={{ marginTop: 4 }}>{voice.state.replace('_', ' ')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {(NEXT_STATE[voice.state] ?? []).map((s) => (
              <button key={s} onClick={() => transition(s)} className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none', padding: '8px 12px', cursor: 'pointer' }}>
                → {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label" style={{ marginBottom: 4 }}>Format</p>
          <select value={voice.format} onChange={(e) => patch((v) => ({ ...v, format: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }}>
            {FORMATS.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label" style={{ marginBottom: 4 }}>Slug</p>
          <input value={voice.slug} onChange={(e) => patch((v) => ({ ...v, slug: e.target.value }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, fontFamily: 'var(--font-mono)' }} />
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label" style={{ marginBottom: 4 }}>Pillar</p>
          <select value={voice.pillar_id ?? ''} onChange={(e) => patch((v) => ({ ...v, pillar_id: e.target.value || null }))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }}>
            <option value="">— none —</option>
            {pillars.map((p) => <option key={p.id} value={p.id}>{p.label_en}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label" style={{ marginBottom: 4 }}>Disciplines</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {disciplines.map((d) => {
              const active = voice.discipline_ids?.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => patch((v) => ({
                    ...v,
                    discipline_ids: active
                      ? (v.discipline_ids ?? []).filter((x) => x !== d.id)
                      : [...(v.discipline_ids ?? []), d.id],
                  }))}
                  className="t-label"
                  style={{
                    background: active ? 'var(--cdcc-gold)' : 'var(--bg-2)',
                    color: active ? 'var(--fg-inverse)' : 'var(--fg-2)',
                    border: '1px solid var(--border-gold-soft)',
                    padding: '3px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {d.label_en}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="t-label" style={{ marginBottom: 4 }}>Scheduled publish</p>
          <input type="datetime-local" value={voice.scheduled_at ? voice.scheduled_at.slice(0, 16) : ''}
            onChange={(e) => patch((v) => ({ ...v, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
            style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 13 }}
          />
        </div>

        {previewHref && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p className="t-label" style={{ marginBottom: 4 }}>Preview</p>
            <a href={previewHref} target="_blank" rel="noreferrer" className="t-button" style={{ display: 'block', textAlign: 'center', padding: '8px 12px', border: '1px solid var(--cdcc-charcoal)', color: 'var(--fg-1)', textDecoration: 'none' }}>
              Open preview →
            </a>
          </div>
        )}

        <details style={{ marginBottom: 'var(--space-5)' }}>
          <summary className="t-label" style={{ cursor: 'pointer' }}>SEO · Social</summary>
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="t-label" style={{ marginBottom: 4 }}>SEO title</span>
              <input value={voice.seo_title_en ?? ''} onChange={(e) => patch((v) => ({ ...v, seo_title_en: e.target.value }))} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="t-label" style={{ marginBottom: 4 }}>SEO description</span>
              <textarea value={voice.seo_description_en ?? ''} onChange={(e) => patch((v) => ({ ...v, seo_description_en: e.target.value }))} rows={3} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, fontFamily: 'inherit' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="t-label" style={{ marginBottom: 4 }}>Social image URL</span>
              <input value={voice.social_image_url ?? ''} onChange={(e) => patch((v) => ({ ...v, social_image_url: e.target.value }))} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13 }} />
            </label>
          </div>
        </details>

        <details style={{ marginBottom: 'var(--space-5)' }}>
          <summary className="t-label" style={{ cursor: 'pointer' }}>Print</summary>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-3)', fontSize: 13 }}>
            <input type="checkbox" checked={voice.print_included} onChange={(e) => patch((v) => ({ ...v, print_included: e.target.checked }))} />
            Include in next booklet export
          </label>
        </details>

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-soft)' }}>
          <div className="t-caption" style={{ color: saving ? 'var(--fg-accent)' : dirty ? 'var(--cdcc-amber)' : 'var(--fg-3)' }}>
            {saving ? 'Saving…' : dirty ? 'Unsaved changes' : (message ?? 'All saved.')}
          </div>
          {err && <div className="t-caption" style={{ color: 'var(--cdcc-red)', marginTop: 4 }}>{err}</div>}
          <button onClick={remove} className="t-button" style={{ marginTop: 'var(--space-4)', background: 'transparent', border: '1px solid var(--cdcc-red)', color: 'var(--cdcc-red)', padding: '6px 10px', cursor: 'pointer', fontSize: 10 }}>
            Delete Voice
          </button>
        </div>
      </aside>
    </div>
  );
}
