/**
 * Event-reminder template — ported from the inline string helper in
 * the legacy `lib/email.ts` into the brand-aligned render pipeline.
 */

import { renderEmail, type RenderedEmail } from '../render-html';

export interface EventReminderData {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  venue: string | null;
  eventUrl: string;
}

export function renderEventReminderEmail(opts: EventReminderData): RenderedEmail {
  const firstName = (opts.recipientName || '').split(/\s+/)[0] || 'there';
  const venueLine = opts.venue ? ` at **${opts.venue}**` : '';

  const body = [
    `Hi ${firstName},`,
    `A quick reminder that **${opts.eventTitle}** is coming up on **${opts.eventDate}**${venueLine}.`,
    `Open the event page below for the schedule, speakers, and venue logistics.`,
    `— The CDCC Events team`,
  ].join('\n\n');

  return renderEmail({
    eyebrow: 'Reminder',
    subject: `Reminder · ${opts.eventTitle} · ${opts.eventDate}`,
    body,
    cta: { label: 'View event details', href: opts.eventUrl },
  });
}
