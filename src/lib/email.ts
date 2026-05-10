/**
 * Email send layer.
 *
 * Uses Resend by default (industry-standard, low friction). Switchable to
 * any other provider by implementing the ProviderSend interface.
 *
 * Environment variables (add when keys are provided):
 *   RESEND_API_KEY=re_xxx
 *   CDCC_FROM_EMAIL="CDCC <hello@cdcc.org.za>"
 *
 * If RESEND_API_KEY is unset, sendEmail() logs a preview to the console
 * and returns {ok: true, preview: true} so development continues without
 * errors.
 *
 * Brand-aligned templates live in `src/lib/mail/templates/` and render
 * through the shared scaffold in `src/lib/mail/render-html.ts`. The
 * `template*` helpers below are thin adapters that delegate to those
 * modules so all transactional sends use the same brand HTML.
 */

import { renderEventReminderEmail } from './mail/templates/event-reminder';
import { renderGrantDecisionEmail, type GrantDecision } from './mail/templates/grant-decision';
import { renderCertificateIssuedEmail } from './mail/templates/certificate-issued';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  preview?: boolean;
  error?: string;
}

const RESEND_API = 'https://api.resend.com/emails';

function fromLine(): string {
  return process.env.CDCC_FROM_EMAIL || 'CDCC <hello@cdcc.org.za>';
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;

  // No key in development — log preview + succeed so UX doesn't break
  if (!key) {
    console.info('\n[email preview — RESEND_API_KEY not set]');
    console.info(`  TO:      ${Array.isArray(msg.to) ? msg.to.join(', ') : msg.to}`);
    console.info(`  FROM:    ${fromLine()}`);
    console.info(`  SUBJECT: ${msg.subject}`);
    if (msg.text) console.info(`  TEXT:    ${msg.text.slice(0, 200)}${msg.text.length > 200 ? '…' : ''}`);
    return { ok: true, preview: true };
  }

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromLine(),
        to: Array.isArray(msg.to) ? msg.to : [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        cc: msg.cc,
        bcc: msg.bcc,
        reply_to: msg.replyTo,
        tags: msg.tags ? Object.entries(msg.tags).map(([name, value]) => ({ name, value })) : undefined,
      }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body?.message || `HTTP ${res.status}` };
    return { ok: true, id: body?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Backward-compat template helpers · delegate to brand-pipeline modules
// ---------------------------------------------------------------------------
// These wrappers preserve the existing public API so the ~9 callers don't
// need touching. Each returns the {subject, html, text} tuple expected by
// the existing send sites; behind the scenes every render now flows
// through the shared brand scaffold.

export function templateEventReminder(opts: {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  venue: string | null;
  eventUrl: string;
}): { subject: string; html: string; text: string } {
  const { html, text } = renderEventReminderEmail(opts);
  return {
    subject: `Reminder · ${opts.eventTitle} · ${opts.eventDate}`,
    html,
    text,
  };
}

export function templateGrantDecision(opts: {
  recipientName: string;
  projectTitle: string;
  decision: GrantDecision;
  amount?: number;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject =
    opts.decision === 'awarded' ? `Grant awarded · ${opts.projectTitle}` :
    opts.decision === 'shortlisted' ? `You've been shortlisted · ${opts.projectTitle}` :
    `Update on your application · ${opts.projectTitle}`;
  const { html, text } = renderGrantDecisionEmail(opts);
  return { subject, html, text };
}

export function templateCertificateIssued(opts: {
  recipientName: string;
  certificateTitle: string;
  verifyUrl: string;
}): { subject: string; html: string; text: string } {
  const { html, text } = renderCertificateIssuedEmail(opts);
  return {
    subject: `Your certificate · ${opts.certificateTitle}`,
    html,
    text,
  };
}
