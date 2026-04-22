/**
 * /preview/[token] — token-gated preview of a draft Voice.
 *
 * No login required — the token IS the credential. Useful for sharing
 * a draft with an external reviewer (speaker, contributor, board
 * member) without giving them full admin. Preview renders exactly
 * as the public site would once the Voice goes live.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { BlockStream } from '@/components/press/BlockStream';
import type { Block } from '@/lib/press/blocks/types';

export const dynamic = 'force-dynamic';

type VoiceRow = {
  title_en: string | null;
  title_xh: string | null;
  standfirst_en: string | null;
  standfirst_xh: string | null;
  blocks: Block[];
  format: string;
  state: string;
};

async function loadVoice(token: string): Promise<VoiceRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  // Service role bypasses RLS so drafts are visible via the token.
  const supabase = createClient(url, serviceKey);
  const { data } = await supabase
    .from('press_voices')
    .select('title_en, title_xh, standfirst_en, standfirst_xh, blocks, format, state')
    .eq('preview_token', token)
    .maybeSingle();
  return (data as unknown as VoiceRow | null);
}

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const voice = await loadVoice(token);
  if (!voice) notFound();

  return (
    <div style={{ background: 'var(--bg-1)', color: 'var(--fg-1)', minHeight: '100vh' }}>
      <header style={{
        background: 'var(--bg-dark)', color: 'var(--fg-inverse)',
        padding: 'var(--space-4) var(--page-pad-x)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      }}>
        <span className="t-label" style={{ color: 'var(--cdcc-gold)' }}>Preview</span>
        <span className="t-caption" style={{ color: 'var(--fg-inverse)', opacity: 0.7 }}>
          This is a draft · {voice.state.replace('_', ' ')} · {voice.format.replace('_', ' ')}.
          The public site does not show this Voice until it is Live.
        </span>
      </header>

      <article style={{ maxWidth: 'var(--max-content)', margin: '0 auto', padding: 'var(--space-9) var(--page-pad-x)' }}>
        {voice.title_en && (
          <h1 className="t-heading" style={{ color: 'var(--fg-1)', marginBottom: 'var(--space-3)' }}>{voice.title_en}</h1>
        )}
        {voice.title_xh && (
          <h2 className="t-h3" style={{ color: 'var(--fg-accent)', marginBottom: 'var(--space-5)' }}>{voice.title_xh}</h2>
        )}
        {voice.standfirst_en && (
          <p className="t-h3" style={{ color: 'var(--fg-2)', fontStyle: 'italic', maxWidth: 'var(--max-narrow)', marginBottom: 'var(--space-7)' }}>{voice.standfirst_en}</p>
        )}

        <BlockStream blocks={voice.blocks ?? []} lang="en" />
      </article>
    </div>
  );
}
