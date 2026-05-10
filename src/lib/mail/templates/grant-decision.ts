/**
 * Grant-decision template — awarded / shortlisted / declined.
 * Ported from the inline string helper in legacy `lib/email.ts`.
 */

import { renderEmail, type RenderedEmail } from '../render-html';

export type GrantDecision = 'awarded' | 'shortlisted' | 'declined';

export interface GrantDecisionData {
  recipientName: string;
  projectTitle: string;
  decision: GrantDecision;
  amount?: number;
  notes?: string;
}

export function renderGrantDecisionEmail(opts: GrantDecisionData): RenderedEmail {
  const firstName = (opts.recipientName || '').split(/\s+/)[0] || 'there';

  const eyebrow =
    opts.decision === 'awarded' ? 'Grant awarded' :
    opts.decision === 'shortlisted' ? 'Shortlisted' :
    'Application update';

  const subject =
    opts.decision === 'awarded' ? `Grant awarded · ${opts.projectTitle}` :
    opts.decision === 'shortlisted' ? `You've been shortlisted · ${opts.projectTitle}` :
    `Update on your application · ${opts.projectTitle}`;

  const headline =
    opts.decision === 'awarded'
      ? `Congratulations · your application for **${opts.projectTitle}** has been awarded${opts.amount ? ` (R ${opts.amount.toLocaleString('en-ZA')})` : ''}.`
      : opts.decision === 'shortlisted'
      ? `Your application for **${opts.projectTitle}** has been shortlisted.`
      : `We regret to inform you that your application for **${opts.projectTitle}** was not successful on this round.`;

  const bodyParts = [`Hi ${firstName},`, headline];
  if (opts.notes) bodyParts.push(opts.notes);
  bodyParts.push('— The CDCC Grants Committee');

  return renderEmail({
    eyebrow,
    subject,
    body: bodyParts.join('\n\n'),
  });
}
