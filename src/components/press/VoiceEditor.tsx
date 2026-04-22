'use client';

/**
 * VoiceEditor — the block-based authoring UI.
 *
 * Renders a block list with drag-handles (simple up/down for now),
 * an add-block menu keyed off BLOCK_REGISTRY, and a bilingual pane
 * per block. Uses the existing RichTextEditor for Prose blocks so
 * editors get the Tiptap experience they're used to.
 *
 * State shape matches press_voices.blocks jsonb column exactly.
 */

import { useState } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { BLOCK_REGISTRY, newBlock, type Block, type BlockType } from '@/lib/press/blocks/types';

export interface VoiceEditorProps {
  value: Block[];
  onChange: (next: Block[]) => void;
}

export function VoiceEditor({ value, onChange }: VoiceEditorProps) {
  const [pickerOpenAt, setPickerOpenAt] = useState<number | null>(null);

  const update = (key: string, mutator: (b: Block) => Block) => {
    onChange(value.map((b) => (b.key === key ? mutator(b) : b)));
  };

  const move = (key: string, direction: -1 | 1) => {
    const idx = value.findIndex((b) => b.key === key);
    if (idx < 0) return;
    const next = [...value];
    const swap = idx + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  const remove = (key: string) => onChange(value.filter((b) => b.key !== key));

  const insert = (type: BlockType, at: number) => {
    const block = newBlock(type);
    const next = [...value];
    next.splice(at, 0, block);
    onChange(next);
    setPickerOpenAt(null);
  };

  return (
    <div className="press-voice-editor" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <InsertRow index={0} openAt={pickerOpenAt} setOpenAt={setPickerOpenAt} onInsert={insert} />
      {value.map((block, idx) => (
        <div key={block.key}>
          <BlockCard block={block} onChange={(mutator) => update(block.key, mutator)} onMoveUp={() => move(block.key, -1)} onMoveDown={() => move(block.key, 1)} onRemove={() => remove(block.key)} />
          <InsertRow index={idx + 1} openAt={pickerOpenAt} setOpenAt={setPickerOpenAt} onInsert={insert} />
        </div>
      ))}
      {value.length === 0 && (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>
          Empty Voice. Add a block above to begin.
        </p>
      )}
    </div>
  );
}

function InsertRow({ index, openAt, setOpenAt, onInsert }: {
  index: number;
  openAt: number | null;
  setOpenAt: (n: number | null) => void;
  onInsert: (t: BlockType, at: number) => void;
}) {
  const open = openAt === index;
  return (
    <div style={{ position: 'relative', minHeight: 12, display: 'flex', justifyContent: 'center' }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpenAt(index)}
          className="t-label"
          style={{ background: 'transparent', border: '1px dashed var(--border-soft)', padding: '2px 10px', color: 'var(--fg-3)', cursor: 'pointer', opacity: 0.6 }}
        >
          + add block
        </button>
      ) : (
        <div style={{ width: '100%', border: '1px solid var(--border-gold-soft)', background: 'var(--bg-2)', padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {BLOCK_REGISTRY.map((entry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => onInsert(entry.type, index)}
              disabled={!!entry.pendingPhase}
              style={{
                background: 'var(--bg-1)', border: '1px solid var(--border-soft)', padding: 'var(--space-3)', textAlign: 'left', cursor: entry.pendingPhase ? 'not-allowed' : 'pointer',
                opacity: entry.pendingPhase ? 0.4 : 1,
              }}
            >
              <div className="t-card-title" style={{ fontSize: 13 }}>{entry.label}</div>
              <div className="t-caption" style={{ marginTop: 2 }}>{entry.caption}</div>
              {entry.pendingPhase && <div className="t-label" style={{ marginTop: 4, color: 'var(--fg-accent)' }}>Ships · Phase {entry.pendingPhase}</div>}
            </button>
          ))}
          <button type="button" onClick={() => setOpenAt(null)} className="t-button" style={{ background: 'transparent', border: '1px solid var(--cdcc-charcoal)', padding: 'var(--space-2)', gridColumn: '1 / -1' }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function BlockCard({ block, onChange, onMoveUp, onMoveDown, onRemove }: {
  block: Block;
  onChange: (m: (b: Block) => Block) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="press-block-card" style={{ border: '1px solid var(--border-soft)', padding: 'var(--space-4)', background: 'var(--bg-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <span className="t-label">{block.type.replace('_', ' ')}</span>
        <span style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
          <ToolbarBtn onClick={onMoveUp}>↑</ToolbarBtn>
          <ToolbarBtn onClick={onMoveDown}>↓</ToolbarBtn>
          <ToolbarBtn onClick={onRemove} danger>×</ToolbarBtn>
        </span>
      </div>
      <BlockFields block={block} onChange={onChange} />
    </div>
  );
}

function ToolbarBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: 28, height: 28,
      background: 'var(--bg-1)',
      border: '1px solid var(--border-soft)',
      color: danger ? 'var(--cdcc-red)' : 'var(--fg-2)',
      cursor: 'pointer',
      fontSize: 13,
    }}>{children}</button>
  );
}

function BilingualInput({ label, valueEn, valueXh, onChangeEn, onChangeXh, multiline }: {
  label: string;
  valueEn: string;
  valueXh: string;
  onChangeEn: (v: string) => void;
  onChangeXh: (v: string) => void;
  multiline?: boolean;
}) {
  const Field = multiline ? 'textarea' : 'input';
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: '1fr 1fr', marginBottom: 'var(--space-3)' }}>
      <label style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="t-label" style={{ marginBottom: 4 }}>{label} · EN</span>
        <Field value={valueEn} onChange={(e) => onChangeEn((e.target as HTMLInputElement).value)} rows={multiline ? 3 : undefined}
          style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', font: 'inherit', fontSize: 14 }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="t-label" style={{ marginBottom: 4, color: 'var(--fg-accent)' }}>{label} · XH</span>
        <Field value={valueXh} onChange={(e) => onChangeXh((e.target as HTMLInputElement).value)} rows={multiline ? 3 : undefined}
          placeholder="Translate later or queue for translation"
          style={{ width: '100%', padding: 8, border: '1px solid var(--border-gold-soft)', font: 'inherit', fontSize: 14, background: 'var(--bg-2)' }}
        />
      </label>
    </div>
  );
}

function BlockFields({ block, onChange }: { block: Block; onChange: (m: (b: Block) => Block) => void }) {
  switch (block.type) {
    case 'standfirst':
      return (
        <>
          <BilingualInput label="Eyebrow" valueEn={block.props.eyebrow_en ?? ''} valueXh={block.props.eyebrow_xh ?? ''}
            onChangeEn={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, eyebrow_en: v } } as Block))}
            onChangeXh={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, eyebrow_xh: v } } as Block))}
          />
          <BilingualInput label="Lead sentence" multiline valueEn={block.props.lead_en ?? ''} valueXh={block.props.lead_xh ?? ''}
            onChangeEn={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, lead_en: v } } as Block))}
            onChangeXh={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, lead_xh: v } } as Block))}
          />
        </>
      );
    case 'prose':
      return (
        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <p className="t-label" style={{ marginBottom: 4 }}>Prose · EN</p>
            <RichTextEditor value={block.props.html_en ?? ''} onChange={(html: string) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, html_en: html } } as Block))} />
          </div>
          <div>
            <p className="t-label" style={{ marginBottom: 4, color: 'var(--fg-accent)' }}>Prose · XH</p>
            <RichTextEditor value={block.props.html_xh ?? ''} onChange={(html: string) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, html_xh: html } } as Block))} />
          </div>
        </div>
      );
    case 'pull':
      return (
        <>
          <BilingualInput label="Quote" multiline valueEn={block.props.quote_en ?? ''} valueXh={block.props.quote_xh ?? ''}
            onChangeEn={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, quote_en: v } } as Block))}
            onChangeXh={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, quote_xh: v } } as Block))}
          />
          <label style={{ display: 'block' }}>
            <span className="t-label" style={{ marginBottom: 4, display: 'block' }}>Attribution</span>
            <input value={block.props.attribution ?? ''} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, attribution: e.target.value } } as Block))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
        </>
      );
    case 'stat':
      return (
        <div style={{ display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: '140px 1fr 1fr' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Value</span>
            <input value={block.props.value} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, value: e.target.value } } as Block))} placeholder="14" style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Label · EN</span>
            <input value={block.props.label_en} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, label_en: e.target.value } } as Block))} placeholder="disciplines" style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4, color: 'var(--fg-accent)' }}>Label · XH</span>
            <input value={block.props.label_xh ?? ''} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, label_xh: e.target.value } } as Block))} style={{ padding: 8, border: '1px solid var(--border-gold-soft)', fontSize: 14, background: 'var(--bg-2)' }} />
          </label>
        </div>
      );
    case 'figure':
      return (
        <>
          <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
            <span className="t-label" style={{ marginBottom: 4, display: 'block' }}>Asset URL (paste from Library for now)</span>
            <input value={block.props.src ?? ''} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, src: e.target.value } } as Block))} placeholder="/uploads/..." style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
          <BilingualInput label="Alt text" valueEn={block.props.alt_en ?? ''} valueXh={block.props.alt_xh ?? ''}
            onChangeEn={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, alt_en: v } } as Block))}
            onChangeXh={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, alt_xh: v } } as Block))}
          />
          <BilingualInput label="Caption" valueEn={block.props.caption_en ?? ''} valueXh={block.props.caption_xh ?? ''}
            onChangeEn={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, caption_en: v } } as Block))}
            onChangeXh={(v) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, caption_xh: v } } as Block))}
          />
          <label style={{ display: 'block' }}>
            <span className="t-label" style={{ marginBottom: 4, display: 'block' }}>Credit</span>
            <input value={block.props.credit ?? ''} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, credit: e.target.value } } as Block))} style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
        </>
      );
    case 'chip':
      return (
        <div style={{ display: 'grid', gap: 'var(--space-2)', gridTemplateColumns: '140px 1fr' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Kind</span>
            <select value={block.props.kind} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, kind: e.target.value as 'discipline' | 'pillar' } } as Block))} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }}>
              <option value="discipline">discipline</option>
              <option value="pillar">pillar</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="t-label" style={{ marginBottom: 4 }}>Slug</span>
            <input value={block.props.slug} onChange={(e) => onChange((b) => ({ ...b, props: { ...(b as typeof block).props, slug: e.target.value } } as Block))} placeholder="authors · translators · build_author_capacity" style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 14 }} />
          </label>
        </div>
      );
    case 'booklet_break':
      return <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>Print-only. No fields.</p>;
    default:
      return (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>
          {block.type} — field UI ships when its primitive lands. Block saved to the stream either way.
        </p>
      );
  }
}
