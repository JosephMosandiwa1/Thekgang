import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ReviewActions } from './review-actions';

export const dynamic = 'force-dynamic';

interface SubmissionRow {
  id: string;
  source: string;
  source_pk: string;
  submitted_at: string;
  submitter_email: string | null;
  submitter_name: string | null;
  summary: string | null;
  status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  payload: Record<string, unknown> | null;
}

export default async function InboxDetailPage({
  params,
}: {
  params: Promise<{ source: string; id: string }>;
}) {
  const { source, id } = await params;
  const sourceDecoded = decodeURIComponent(source);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return notFound();

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from('v_all_submissions')
    .select('*')
    .eq('source', sourceDecoded)
    .eq('source_pk', id)
    .maybeSingle();

  if (error || !data) return notFound();
  const row = data as SubmissionRow;
  const payload = row.payload || {};

  const isJoinApp = sourceDecoded === 'join';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Link href="/admin/inbox" style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ← Back to inbox
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>
          {row.summary || 'Submission'}
        </h1>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>Source: <strong style={{ color: 'var(--cdcc-gold)' }}>{sourceDecoded}</strong></span>
          <span>Submitted: {new Date(row.submitted_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          <span>Status: {row.status || 'new'}</span>
          {row.reviewed_at && (
            <span>Reviewed: {new Date(row.reviewed_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}{row.reviewed_by ? ` by ${row.reviewed_by}` : ''}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Left · payload */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Submitted data</h2>
          <PropertyTable obj={payload} />
        </div>

        {/* Right · actions + notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Review</h2>
            <ReviewActions
              source={sourceDecoded}
              sourcePk={id}
              currentStatus={row.status || 'new'}
              currentNotes={row.notes || ''}
              isJoinApp={isJoinApp}
            />
          </div>

          {row.submitter_email && (
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Quick contact</h2>
              <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>
                <a href={`mailto:${row.submitter_email}?subject=${encodeURIComponent('Re: ' + (row.summary ?? 'your CDCC submission'))}`} style={{ color: 'var(--cdcc-gold)' }}>
                  Email {row.submitter_email}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyTable({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0));
  if (entries.length === 0) return <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>No data</p>;
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 16px', margin: 0, fontSize: 13 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={{ color: 'var(--fg-3)', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, paddingTop: 2 }}>
            {k.replace(/_/g, ' ')}
          </dt>
          <dd style={{ margin: 0, color: 'var(--fg-1)', wordBreak: 'break-word' }}>
            {renderValue(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function renderValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    return (
      <pre style={{ margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-2)', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  if (typeof v === 'string' && v.length > 200) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{v}</div>;
  }
  return String(v);
}

const cardStyle: React.CSSProperties = {
  padding: 18,
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  background: 'var(--bg-1)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--fg-3)',
  fontWeight: 700,
  margin: 0,
  fontFamily: 'var(--font-sans)',
};
