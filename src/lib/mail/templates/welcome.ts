/**
 * Welcome / membership-application template.
 *
 * Two variants:
 *   - applicant: "Your application has been received" (sent on /join submit)
 *   - approved:  "You've been approved · activate your portal" (sent from
 *                inbox approveAsMember server action)
 *
 * Renders through the shared brand HTML scaffold so headers, footers,
 * cream surface, and CDCC mark all match every other transactional send.
 */

import { renderEmail, type RenderedEmail } from '../render-html';
import { matchProvinceContact } from '../components';

export type WelcomeVariant = 'applicant' | 'approved';

export interface WelcomeData {
  /** Recipient name. First word becomes the greeting. */
  name: string;
  /** Variant · changes copy + subject. */
  variant: WelcomeVariant;
  /** Optional province · drives the chapter rail in the body. */
  province?: string | null;
  /** Required for `approved` variant · member number assigned on approval. */
  memberNumber?: string;
  /** Required for `approved` variant · portal-activation URL. */
  activationUrl?: string;
}

export function renderWelcomeEmail(data: WelcomeData): RenderedEmail {
  const firstName = (data.name || '').split(/\s+/)[0] || 'there';
  const province = data.province ? matchProvinceContact(data.province)?.name : null;

  if (data.variant === 'applicant') {
    const body = [
      `Hi ${firstName},`,
      `Thank you for applying to join the **Content Developers and Creators Council** — South Africa's national body for the books and publishing sector.`,
      `Your application is in our review queue. Within two working days, a member of the secretariat will reach out about next steps.${province ? ` Once approved, you'll be connected to the ${province} chapter.` : ''}`,
      `If you applied by mistake or have questions, just reply to this email — someone will respond.`,
      `— The CDCC Secretariat`,
    ].join('\n\n');

    return renderEmail({
      eyebrow: 'Membership',
      subject: 'Your CDCC membership application has been received',
      body,
    });
  }

  // approved
  const body = [
    `Hi ${firstName},`,
    `Welcome to the **Council**. Your CDCC membership application has been approved.`,
    `Your member number is **${data.memberNumber ?? 'to follow'}**.${province ? ` You're now part of the ${province} chapter.` : ''}`,
    `Activate your member portal using the button below — you'll set a password, complete your profile, and gain access to programmes, opportunities, and the council voice.`,
    `If you don't see a separate "set up your password" email within a few minutes, check your spam folder.`,
    `— The CDCC Secretariat`,
  ].join('\n\n');

  return renderEmail({
    eyebrow: 'Approved',
    subject: "You're approved · welcome to the CDCC",
    body,
    cta: data.activationUrl
      ? { label: 'Activate your portal', href: data.activationUrl }
      : undefined,
  });
}
