/**
 * Per-staff email-signature loader.
 *
 * Looks up a signature row keyed by mailbox (e.g. the
 * `MAIL_USER` or `CDCC_FROM_EMAIL` envelope address) and returns a
 * pre-formatted HTML signature block ready to be injected into
 * `renderEmail({ signature })`.
 *
 * Falls back to a generic CDCC sign-off if no signature is found
 * — so unattributed system sends still close cleanly.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOKENS, FONT_STACK, escape } from './components';

const BRAND = TOKENS.light;

export interface StaffSignature {
  display_name: string;
  role?: string | null;
  team?: string | null;
  phone?: string | null;
  email?: string | null;
  pronouns?: string | null;
}

const DEFAULT_SIGNATURE = `
  <p style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.55;color:${BRAND.fg};">
    <strong>The CDCC Secretariat</strong>
  </p>
  <p style="margin:4px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.55;color:${BRAND.muted};">
    Books &amp; Publishing · Content Developers and Creators Council
  </p>
`.trim();

function formatSignature(sig: StaffSignature): string {
  const role = sig.role
    ? `<span style="color:${BRAND.muted};">${escape(sig.role)}</span>`
    : '';
  const team = sig.team
    ? `<span style="color:${BRAND.muted};">${escape(sig.team)}</span>`
    : '';
  const pronouns = sig.pronouns
    ? `<span style="font-size:11px;color:${BRAND.subtle};margin-left:8px;">(${escape(sig.pronouns)})</span>`
    : '';
  const contactLine: string[] = [];
  if (sig.email) contactLine.push(`<a href="mailto:${escape(sig.email)}" style="color:${BRAND.muted};text-decoration:none;">${escape(sig.email)}</a>`);
  if (sig.phone) contactLine.push(escape(sig.phone));

  return `
    <p style="margin:0;font-family:${FONT_STACK};font-size:13px;line-height:1.55;color:${BRAND.fg};">
      <strong>${escape(sig.display_name)}</strong>${pronouns}
    </p>
    ${role || team ? `<p style="margin:4px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.55;">${[role, team].filter(Boolean).join(' · ')}</p>` : ''}
    ${contactLine.length ? `<p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.55;color:${BRAND.muted};">${contactLine.join(' · ')}</p>` : ''}
  `.trim();
}

/**
 * Try to load a signature row from `email_staff` if the table exists
 * (matches the VACSA pattern); otherwise return the default sign-off.
 */
export async function loadSignature(
  sb: SupabaseClient | null,
  mailbox: string | null,
): Promise<string> {
  if (!sb || !mailbox) return DEFAULT_SIGNATURE;
  try {
    const { data } = await sb
      .from('email_staff')
      .select('display_name,role,team,phone,email,pronouns,active')
      .eq('mailbox', mailbox.toLowerCase())
      .eq('active', true)
      .maybeSingle();
    if (!data) return DEFAULT_SIGNATURE;
    return formatSignature(data as StaffSignature);
  } catch {
    // Table missing or permission failure — fall back gracefully
    return DEFAULT_SIGNATURE;
  }
}

export { DEFAULT_SIGNATURE };
