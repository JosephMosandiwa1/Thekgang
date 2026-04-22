/**
 * BlockStream — web renderer for a Voice's block array.
 *
 * Server component. Reads the array and renders each registered block.
 * Blocks that depend on pending primitives render a placeholder so
 * Voices authored with those blocks don't crash the public render.
 */

import Image from 'next/image';
import type { Block } from '@/lib/press/blocks/types';

export interface BlockStreamProps {
  blocks: Block[];
  lang?: 'en' | 'xh';
}

export function BlockStream({ blocks, lang = 'en' }: BlockStreamProps) {
  return (
    <div className="press-blocks">
      {blocks.map((b) => (
        <RenderBlock key={b.key} block={b} lang={lang} />
      ))}
    </div>
  );
}

function pick(en: string | undefined, xh: string | undefined, lang: 'en' | 'xh'): string {
  if (lang === 'xh' && xh) return xh;
  return en ?? '';
}

function RenderBlock({ block, lang }: { block: Block; lang: 'en' | 'xh' }) {
  switch (block.type) {
    case 'standfirst':
      return (
        <header className="press-block-standfirst" style={{ margin: 'var(--space-6) 0 var(--space-5)' }}>
          {(block.props.eyebrow_en || block.props.eyebrow_xh) && (
            <p className="t-label" style={{ marginBottom: 'var(--space-2)' }}>{pick(block.props.eyebrow_en, block.props.eyebrow_xh, lang)}</p>
          )}
          <p className="t-h3" style={{ color: 'var(--fg-1)', fontStyle: 'italic', maxWidth: 'var(--max-narrow)' }}>
            {pick(block.props.lead_en, block.props.lead_xh, lang)}
          </p>
        </header>
      );

    case 'prose':
      return (
        <div
          className="press-block-prose t-body"
          style={{ maxWidth: 'var(--max-narrow)', margin: 'var(--space-5) 0' }}
          dangerouslySetInnerHTML={{ __html: pick(block.props.html_en, block.props.html_xh, lang) }}
        />
      );

    case 'pull':
      return (
        <blockquote
          className="press-block-pull"
          style={{
            margin: 'var(--space-7) 0',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-h2)',
            fontWeight: 'var(--fw-bold)',
            lineHeight: 'var(--lh-heading)',
            color: 'var(--cdcc-gold)',
            maxWidth: 'var(--max-content)',
            borderLeft: '2px solid var(--cdcc-gold)',
            paddingLeft: 'var(--space-5)',
          }}
        >
          {pick(block.props.quote_en, block.props.quote_xh, lang)}
          {block.props.attribution && (
            <footer className="t-caption" style={{ marginTop: 'var(--space-3)', color: 'var(--fg-3)', fontStyle: 'normal' }}>— {block.props.attribution}</footer>
          )}
        </blockquote>
      );

    case 'stat':
      return (
        <p className="press-block-stat" style={{ margin: 'var(--space-5) 0' }}>
          <span className="t-mono" style={{ fontSize: 'var(--fs-heading)', fontWeight: 'var(--fw-bold)', color: 'var(--cdcc-charcoal)', marginRight: 'var(--space-3)' }}>
            {block.props.value}
          </span>
          <span className="t-label" style={{ color: 'var(--fg-accent)' }}>{pick(block.props.label_en, block.props.label_xh, lang)}</span>
        </p>
      );

    case 'figure': {
      const src = block.props.src;
      const alt = pick(block.props.alt_en, block.props.alt_xh, lang);
      const caption = pick(block.props.caption_en, block.props.caption_xh, lang);
      return (
        <figure className="press-block-figure" style={{ margin: 'var(--space-6) 0', maxWidth: 'var(--max-content)' }}>
          {src ? (
            <Image src={src} alt={alt ?? ''} width={1200} height={675} style={{ width: '100%', height: 'auto' }} unoptimized />
          ) : (
            <div style={{ aspectRatio: '16/9', background: 'var(--bg-2)', color: 'var(--fg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Figure</div>
          )}
          {(caption || block.props.credit) && (
            <figcaption className="t-caption" style={{ marginTop: 'var(--space-3)', color: 'var(--fg-3)' }}>
              {caption}
              {block.props.credit && <span style={{ marginLeft: 'var(--space-2)', fontStyle: 'italic' }}>· {block.props.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'media':
      return (
        <div className="press-block-media" style={{ margin: 'var(--space-6) 0' }}>
          {block.props.kind === 'audio' ? (
            block.props.src && <audio controls src={block.props.src} style={{ width: '100%' }} />
          ) : (
            block.props.src && <video controls src={block.props.src} style={{ width: '100%' }} />
          )}
          {pick(block.props.transcript_en, block.props.transcript_xh, lang) && (
            <details style={{ marginTop: 'var(--space-3)' }}>
              <summary className="t-label" style={{ cursor: 'pointer' }}>Transcript</summary>
              <p className="t-body" style={{ marginTop: 'var(--space-3)' }}>{pick(block.props.transcript_en, block.props.transcript_xh, lang)}</p>
            </details>
          )}
        </div>
      );

    case 'add_to_calendar':
      return (
        <div className="press-block-ics" style={{ margin: 'var(--space-5) 0' }}>
          <a href={`/api/press/ics?event=${encodeURIComponent(block.props.event_id)}`} className="t-button" style={{ border: '1px solid var(--cdcc-charcoal)', padding: '10px 14px', display: 'inline-block', color: 'var(--fg-1)', textDecoration: 'none' }}>
            {pick(block.props.label_en, block.props.label_xh, lang) || 'Add to calendar'} →
          </a>
        </div>
      );

    case 'chip':
      return (
        <a
          href={`/${block.props.kind}/${block.props.slug}`}
          className="t-label"
          style={{ display: 'inline-flex', padding: '4px 8px', border: '1px solid var(--border-gold-soft)', color: 'var(--fg-accent)', textDecoration: 'none', margin: '0 var(--space-2)' }}
        >
          {pick(block.props.label_en, block.props.label_xh, lang) || block.props.slug}
        </a>
      );

    case 'booklet_break':
      // Print-only; invisible on web
      return <div className="press-booklet-break" aria-hidden style={{ pageBreakAfter: 'always' }} />;

    case 'booklet_header':
      return (
        <header className="press-block-booklet-header" style={{ margin: 'var(--space-8) 0 var(--space-6)', borderTop: '2px solid var(--cdcc-gold)', paddingTop: 'var(--space-5)' }}>
          <h2 className="t-heading">{pick(block.props.title_en, block.props.title_xh, lang)}</h2>
          {(block.props.subtitle_en || block.props.subtitle_xh) && (
            <p className="t-body-sm" style={{ color: 'var(--fg-3)' }}>{pick(block.props.subtitle_en, block.props.subtitle_xh, lang)}</p>
          )}
        </header>
      );

    case 'booklet_colophon':
      return (
        <footer className="press-block-colophon t-body-sm" style={{ margin: 'var(--space-8) 0', padding: 'var(--space-5)', borderTop: '1px solid var(--border-soft)', color: 'var(--fg-3)' }}>
          {pick(block.props.body_en, block.props.body_xh, lang)}
        </footer>
      );

    // Pending primitives — render a placeholder on the public site until their phase ships
    case 'roster':
    case 'programme_card':
    case 'campaign_card':
    case 'imbizo_outcomes':
    case 'asset_pack':
    case 'form_embed':
    case 'indicator_chart':
      return (
        <div className="press-block-pending t-caption" style={{
          margin: 'var(--space-5) 0',
          padding: 'var(--space-4)',
          border: '1px dashed var(--border-soft)',
          background: 'var(--bg-2)',
          color: 'var(--fg-3)',
        }}>
          [{block.type.replace('_', ' ')}] — ships with a later phase of The Press.
        </div>
      );

    default: {
      const exhaustive: never = block;
      return null as unknown as JSX.Element;
    }
  }
}
