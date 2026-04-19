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
 * and returns {ok: true, preview: true} so development continues without errors.
 */

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
// Templates
// ---------------------------------------------------------------------------
export function templateEventReminder(opts: {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  venue: string | null;
  eventUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Reminder: ${opts.eventTitle} — ${opts.eventDate}`;
  const text = `Hi ${opts.recipientName},\n\nA quick reminder that ${opts.eventTitle} is coming up on ${opts.eventDate}${opts.venue ? ` at ${opts.venue}` : ''}.\n\nDetails: ${opts.eventUrl}\n\n— CDCC`;
  const html = `<p>Hi ${opts.recipientName},</p><p>A quick reminder that <strong>${opts.eventTitle}</strong> is coming up on <strong>${opts.eventDate}</strong>${opts.venue ? ` at ${opts.venue}` : ''}.</p><p><a href="${opts.eventUrl}">View event details →</a></p><p>— CDCC</p>`;
  return { subject, html, text };
}

export function templateGrantDecision(opts: {
  recipientName: string;
  projectTitle: string;
  decision: 'awarded' | 'shortlisted' | 'declined';
  amount?: number;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const subject =
    opts.decision === 'awarded' ? `Grant awarded: ${opts.projectTitle}` :
    opts.decision === 'shortlisted' ? `You've been shortlisted: ${opts.projectTitle}` :
    `Update on your application: ${opts.projectTitle}`;
  const bodyLine =
    opts.decision === 'awarded' ? `Congratulations — your application for <strong>${opts.projectTitle}</strong> has been awarded${opts.amount ? ` (R ${opts.amount.toLocaleString()})` : ''}.` :
    opts.decision === 'shortlisted' ? `Your application for <strong>${opts.projectTitle}</strong> has been shortlisted.` :
    `We regret to inform you that your application for <strong>${opts.projectTitle}</strong> was not successful on this round.`;
  const html = `<p>Hi ${opts.recipientName},</p><p>${bodyLine}</p>${opts.notes ? `<p>${opts.notes}</p>` : ''}<p>— CDCC Grants Committee</p>`;
  const text = `Hi ${opts.recipientName},\n\n${bodyLine.replace(/<[^>]+>/g, '')}\n\n${opts.notes || ''}\n\n— CDCC Grants Committee`;
  return { subject, html, text };
}

export function templateCertificateIssued(opts: {
  recipientName: string;
  certificateTitle: string;
  verifyUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your certificate: ${opts.certificateTitle}`;
  const html = `<p>Hi ${opts.recipientName},</p><p>Your certificate for <strong>${opts.certificateTitle}</strong> is ready. It is publicly verifiable at: <a href="${opts.verifyUrl}">${opts.verifyUrl}</a></p><p>— CDCC</p>`;
  const text = `Hi ${opts.recipientName},\n\nYour certificate for ${opts.certificateTitle} is ready. Verify at: ${opts.verifyUrl}\n\n— CDCC`;
  return { subject, html, text };
}
