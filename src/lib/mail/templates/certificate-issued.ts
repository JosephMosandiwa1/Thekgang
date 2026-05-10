/**
 * Certificate-issued template — recipient gets a verifiable
 * certificate URL after attending an event / completing a programme.
 * Ported from the inline string helper in legacy `lib/email.ts`.
 */

import { renderEmail, type RenderedEmail } from '../render-html';

export interface CertificateIssuedData {
  recipientName: string;
  certificateTitle: string;
  verifyUrl: string;
}

export function renderCertificateIssuedEmail(opts: CertificateIssuedData): RenderedEmail {
  const firstName = (opts.recipientName || '').split(/\s+/)[0] || 'there';
  const body = [
    `Hi ${firstName},`,
    `Your certificate for **${opts.certificateTitle}** is ready.`,
    `It's publicly verifiable using the link below — share it on LinkedIn, append it to your CV, or attach it to a portfolio submission.`,
    `— The CDCC Programmes team`,
  ].join('\n\n');

  return renderEmail({
    eyebrow: 'Certificate ready',
    subject: `Your certificate · ${opts.certificateTitle}`,
    body,
    cta: { label: 'View + verify certificate', href: opts.verifyUrl },
  });
}
