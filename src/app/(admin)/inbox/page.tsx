import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
}

const SOURCES: { key: string; label: string; matcher?: (s: string) => boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'join', label: 'Membership applications' },
  { key: 'contact', label: 'Contact enquiries' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'volunteer', label: 'Volunteers' },
  { key: 'event_registration', label: 'Event RSVPs' },
  { key: 'consultation', label: 'Consultation responses' },
  { key: 'press_form', label: 'Press forms', matcher: (s) => s.startsWith('press_form') },
];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const sourceFilter = sp.source || 'all';
  const statusFilter = sp.status || 'all';
  const queryFilter = sp.q?.trim() || '';
  const page = Math.max(1, parseInt(sp.page || '1', 10));
  const pageSize = 50;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

  let rows: SubmissionRow[] = [];
  let total = 0;

  if (sb) {
    let q = sb.from('v_all_submissions').select('*', { count: 'exact' }).order('submitted_at', { ascending: false });

    if (sourceFilter !== 'all') {
      const cfg = SOURCES.find((s) => s.key === sourceFilter);
      if (cfg?.matcher) q = q.like('source', 'press_form%');
      else q = q.eq('source', sourceFilter);
    }
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (queryFilter) q = q.or(`submitter_email.ilike.%${queryFilter}%,submitter_name.ilike.%${queryFilter}%,summary.ilike.%${queryFilter}%`);

    q = q.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await q;
    if (!error && data) {
      rows = data as SubmissionRow[];
      total = count ?? 0;
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }}>Inbox</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 0' }}>
          Every form submission across the council, in one place. {total} total · page {page} of {pageCount}.
        </p>
      </div>

      {/* Filters */}
      <form method="get" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select name="source" defaultValue={sourceFilter} style={selectStyle}>
          {SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} style={selectStyle}>
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="pending_review">Pending review</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
        <input
          type="search"
          name="q"
          defaultValue={queryFilter}
          placeholder="Search name, email, summary…"
          style={inputStyle}
        />
        <button type="submit" style={primaryBtnStyle}>
          Filter
        </button>
        {(sourceFilter !== 'all' || statusFilter !== 'all' || queryFilter) && (
          <Link href="/admin/inbox" style={{ fontSize: 12, color: 'var(--fg-3)', textDecoration: 'underline' }}>
            Clear
          </Link>
        )}
      </form>

      {/* List */}
      <div style={{ border: '1px solid var(--border-soft)', borderRadius: 4, overflow: 'hidden', background: 'var(--bg-1)' }}>
        <div style={headerRowStyle}>
          <div style={{ flex: '0 0 160px' }}>Source</div>
          <div style={{ flex: '0 0 130px' }}>Submitted</div>
          <div style={{ flex: '0 0 200px' }}>Submitter</div>
          <div style={{ flex: 1 }}>Summary</div>
          <div style={{ flex: '0 0 110px' }}>Status</div>
        </div>
        {rows.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--fg-3)' }}>No submissions match the current filters.</div>
        )}
        {rows.map((row) => (
          <Link key={`${row.source}-${row.source_pk}`} href={`/admin/inbox/${encodeURIComponent(row.source)}/${row.source_pk}`} style={dataRowStyle}>
            <div style={{ flex: '0 0 160px', fontSize: 11, color: 'var(--cdcc-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {sourceLabel(row.source)}
            </div>
            <div style={{ flex: '0 0 130px', fontSize: 12, color: 'var(--fg-2)' }}>
              {formatDate(row.submitted_at)}
            </div>
            <div style={{ flex: '0 0 200px', minWidth: 0, fontSize: 13, color: 'var(--fg-1)' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {row.submitter_name || '—'}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--fg-3)' }}>
                {row.submitter_email || '—'}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.summary || '—'}
            </div>
            <div style={{ flex: '0 0 110px', fontSize: 11 }}>
              <StatusPill status={row.status || 'new'} />
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          {page > 1 && (
            <Link href={`/admin/inbox?${qs({ ...sp, page: String(page - 1) })}`} style={pageLinkStyle}>
              ← Previous
            </Link>
          )}
          <span style={{ color: 'var(--fg-3)' }}>
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Link href={`/admin/inbox?${qs({ ...sp, page: String(page + 1) })}`} style={pageLinkStyle}>
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    join: 'Membership',
    contact: 'Contact',
    newsletter: 'Newsletter',
    volunteer: 'Volunteer',
    event_registration: 'Event RSVP',
    consultation: 'Consultation',
  };
  if (source.startsWith('press_form:')) return 'Press · ' + source.slice('press_form:'.length);
  return map[source] || source;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
}

function qs(params: Record<string, string | undefined>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) out.set(k, v);
  return out.toString();
}

function StatusPill({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    new: { bg: 'rgba(0,150,255,0.10)', fg: '#0a72c4' },
    pending_review: { bg: 'rgba(245,158,11,0.12)', fg: '#a96100' },
    reviewed: { bg: 'rgba(120,120,120,0.12)', fg: '#555' },
    approved: { bg: 'rgba(16,185,129,0.12)', fg: '#0a7252' },
    rejected: { bg: 'rgba(239,68,68,0.12)', fg: '#a02020' },
    archived: { bg: 'rgba(120,120,120,0.08)', fg: '#888' },
  };
  const c = palette[status] || palette.new;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  fontSize: 13,
  background: 'var(--bg-1)',
  color: 'var(--fg-1)',
  fontFamily: 'var(--font-sans)',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  fontSize: 13,
  background: 'var(--bg-1)',
  color: 'var(--fg-1)',
  flex: '1 1 240px',
  minWidth: 200,
  fontFamily: 'var(--font-sans)',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 0,
  borderRadius: 4,
  fontSize: 12,
  background: 'var(--cdcc-charcoal)',
  color: 'var(--cdcc-stone)',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: '10px 16px',
  borderBottom: '1px solid var(--border-soft)',
  background: 'var(--bg-2)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--fg-3)',
  fontWeight: 600,
};

const dataRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--border-soft)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background 0.15s',
};

const pageLinkStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  fontSize: 12,
  textDecoration: 'none',
  color: 'var(--fg-1)',
  background: 'var(--bg-1)',
};
