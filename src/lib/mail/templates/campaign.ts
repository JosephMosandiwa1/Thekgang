/**
 * Campaign template · the bridge between the admin-editable
 * `email_templates` registry and the brand HTML scaffold.
 *
 * Admin UI flow:
 *   1. Operator authors / edits a row in `email_templates` (key,
 *      subject, body with {{var}} placeholders, version).
 *   2. Send route loads the row via `loadTemplateByKey()`.
 *   3. Substitutes vars with `renderTemplate()`.
 *   4. Wraps the output through this module → `sendBrandedEmail()`.
 *
 * This module is just a thin adapter — the heavy lifting lives in
 * `render-template.ts` (Mustache substitution) and `render-html.ts`
 * (brand scaffold). Keep transactional copy in `templates/<name>.ts`
 * TS modules instead so it stays git-versioned + type-safe.
 */

import { renderEmail, type RenderedEmail } from '../render-html';

export interface CampaignData {
  /** Resolved subject (after Mustache substitution). */
  subject: string;
  /** Resolved body (after Mustache substitution). */
  body: string;
  /** Optional eyebrow (e.g. "Newsletter", "Programmes"). */
  eyebrow?: string;
  /** Optional CTA pulled to a button below the body. */
  cta?: { label: string; href: string };
  /** Required for newsletter campaigns · powers the unsubscribe link. */
  unsubscribe?: { token: string; baseUrl: string } | null;
}

export function renderCampaignEmail(data: CampaignData): RenderedEmail {
  return renderEmail({
    subject: data.subject,
    body: data.body,
    eyebrow: data.eyebrow ?? 'Campaign',
    cta: data.cta,
    unsubscribe: data.unsubscribe ?? null,
  });
}
