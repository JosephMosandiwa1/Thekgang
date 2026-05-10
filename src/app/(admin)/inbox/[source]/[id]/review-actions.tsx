'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setReview, approveAsMember } from '../../actions';

export function ReviewActions({
  source,
  sourcePk,
  currentStatus,
  currentNotes,
  isJoinApp,
}: {
  source: string;
  sourcePk: string;
  currentStatus: string;
  currentNotes: string;
  isJoinApp: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [reviewer, setReviewer] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function doSetReview() {
    setFeedback(null);
    startTransition(async () => {
      try {
        await setReview(source, sourcePk, status, reviewer || 'admin', notes || undefined);
        setFeedback({ kind: 'success', text: 'Saved.' });
        router.refresh();
      } catch (err) {
        setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Save failed' });
      }
    });
  }

  function doApprove() {
    setFeedback(null);
    if (!confirm('Approve this applicant as a CDCC member? This creates a member record + sends a portal-invite email.')) return;
    startTransition(async () => {
      try {
        const result = await approveAsMember(sourcePk, reviewer || 'admin');
        setFeedback({ kind: 'success', text: `Approved · member number ${result.memberNumber}. Invite sent.` });
        setStatus('approved');
        router.refresh();
      } catch (err) {
        setFeedback({ kind: 'error', text: err instanceof Error ? err.message : 'Approve failed' });
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={labelStyle}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="new">New</option>
          <option value="pending_review">Pending review</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Your name (reviewer)</label>
        <input
          type="text"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="e.g. Joseph M"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 80 }}
          placeholder="Internal notes…"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={doSetReview} disabled={pending} style={primaryBtnStyle}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        {isJoinApp && status !== 'approved' && (
          <button type="button" onClick={doApprove} disabled={pending} style={approveBtnStyle}>
            {pending ? 'Approving…' : 'Approve as member →'}
          </button>
        )}
      </div>
      {feedback && (
        <p style={{
          fontSize: 12,
          margin: 0,
          padding: '8px 12px',
          borderRadius: 4,
          background: feedback.kind === 'success' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
          color: feedback.kind === 'success' ? '#0a7252' : '#a02020',
        }}>
          {feedback.text}
        </p>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--fg-3)',
  fontWeight: 600,
  display: 'block',
  marginBottom: 4,
  fontFamily: 'var(--font-sans)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  fontSize: 13,
  background: 'var(--bg-1)',
  color: 'var(--fg-1)',
  fontFamily: 'var(--font-sans)',
};

const selectStyle: React.CSSProperties = { ...inputStyle };

const primaryBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  border: 0,
  borderRadius: 4,
  fontSize: 11,
  background: 'var(--cdcc-charcoal)',
  color: 'var(--cdcc-stone)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

const approveBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: 'var(--cdcc-gold, #C5A15A)',
  color: '#fff',
};
