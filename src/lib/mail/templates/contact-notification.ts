/**
 * Admin notification template for /api/contact submissions.
 *
 * Sends to CDCC_ADMIN_EMAIL with reply-to set to the sender. The
 * subject already carries the topic + name so this template only
 * has to render the body cleanly through the brand HTML scaffold.
 */

import { renderEmail, type RenderedEmail } from '../render-html';

export interface ContactNotificationData {
  /** Sender display name. */
  name: string;
  /** Sender email · also used as the reply-to at the send site. */
  email: string;
  /** Optional phone number. */
  phone?: string | null;
  /** Topic taxonomy entry · falls back to "general". */
  topic?: string | null;
  /** Optional subject line typed by the sender (separate from email subject). */
  subject?: string | null;
  /** The actual message body. */
  message: string;
}

export function renderContactNotificationEmail(data: ContactNotificationData): RenderedEmail {
  const lines: string[] = [];
  lines.push(`A new enquiry has been submitted via the **CDCC contact form**.`);

  const meta: string[] = [];
  meta.push(`**From:** ${data.name} <${data.email}>`);
  if (data.phone) meta.push(`**Phone:** ${data.phone}`);
  meta.push(`**Topic:** ${data.topic || 'general'}`);
  if (data.subject) meta.push(`**Subject:** ${data.subject}`);
  lines.push(meta.join('\n'));

  lines.push(`---`);
  lines.push(data.message);
  lines.push(`Reply directly to this email to respond — the sender is set as the reply-to address.`);

  return renderEmail({
    eyebrow: 'Inbox',
    subject: `New contact enquiry · ${data.subject || data.topic || 'General'} · ${data.name}`,
    body: lines.join('\n\n'),
  });
}
