/**
 * Email HTML wrapper · the brand-aligned scaffold every transactional
 * send flows through. Inline-CSS only because email clients (Outlook
 * 2016+ especially) strip <style> blocks, ignore CSS variables, and
 * mangle modern selectors.
 *
 * Hex values mirror the canonical tokens in src/app/cdcc-tokens.css.
 * Font fallback chain prioritises DM Sans (web-load it where the client
 * supports it) and falls back to system-ui then Helvetica/Arial.
 *
 * Outputs both HTML and a plain-text alternative so Gmail / Apple Mail /
 * Outlook / spam filters all see a multipart body.
 */

import { TOKENS, ACCENT, FONT_STACK, cdccMark, escape } from './components';

const BRAND = TOKENS.light;

export interface RenderOptions {
  subject: string;
  /**
   * Body text · `\n\n` paragraphs. Leading whitespace preserved so
   * lifted email_templates render verbatim.
   */
  body: string;
  /**
   * Optional eyebrow line above the heading
   * (e.g. "Membership", "Council", "Programmes").
   */
  eyebrow?: string;
  /**
   * Optional CTA pulled to a button below the body.
   */
  cta?: { label: string; href: string };
  /**
   * Per-staff signature block (from `signature.ts`). Already brand-
   * formatted; injected verbatim inside the footer surface.
   */
  signature?: string;
  /**
   * Whether to include the unsubscribe + List-Unsubscribe-style
   * footer (newsletters only).
   */
  unsubscribe?: { token: string; baseUrl: string } | null;
}

export interface RenderedEmail {
  /** HTML body for Content-Type: text/html. */
  html: string;
  /** Plain-text alternative for Content-Type: text/plain. */
  text: string;
}

function plainTextFromBody(body: string): string {
  return body
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\r\n/g, '\n');
}

function paragraphsToHtml(body: string): string {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const lines = block.split('\n').map(escape).join('<br />');
      return `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${BRAND.fg};">${lines}</p>`;
    })
    .join('');
}

export function renderEmail(opts: RenderOptions): RenderedEmail {
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 8px;font-family:${FONT_STACK};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};">${escape(opts.eyebrow)}</p>`
    : '';

  const subjectHtml = `<h1 style="margin:0 0 24px;font-family:${FONT_STACK};font-size:24px;font-weight:700;line-height:1.18;letter-spacing:-0.01em;color:${BRAND.fg};">${escape(opts.subject)}</h1>`;

  const bodyHtml = paragraphsToHtml(opts.body);

  const ctaHtml = opts.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px;">
        <tr>
          <td style="background:${ACCENT};border-radius:2px;">
            <a href="${escape(opts.cta.href)}" style="display:inline-block;padding:14px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:600;letter-spacing:0.02em;color:#FFFFFF;text-decoration:none;">${escape(opts.cta.label)} &rarr;</a>
          </td>
        </tr>
      </table>`
    : '';

  const signatureHtml = opts.signature
    ? `
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid ${BRAND.rule};font-family:${FONT_STACK};font-size:13px;line-height:1.55;color:${BRAND.muted};">
        ${opts.signature}
      </div>`
    : '';

  const unsubscribeHtml = opts.unsubscribe
    ? `
      <p style="margin:24px 0 0;font-family:${FONT_STACK};font-size:11px;line-height:1.5;color:${BRAND.subtle};">
        You received this because you subscribed to CDCC updates.
        <a href="${escape(opts.unsubscribe.baseUrl)}/newsletter/unsubscribe/${escape(opts.unsubscribe.token)}" style="color:${BRAND.subtle};text-decoration:underline;">Unsubscribe</a>
      </p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.inverseBg};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.inverseBg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto 16px;">
          <tr>
            <td align="left" style="padding:0 8px 16px;">
              <span style="vertical-align:middle;margin-right:10px;">${cdccMark(28, ACCENT)}</span>
              <span style="vertical-align:middle;font-family:${FONT_STACK};font-size:18px;font-weight:800;letter-spacing:0.02em;color:${BRAND.inverseFg};">CDCC</span>
              <p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.inverseSubtle};">Books &amp; Publishing · Content Developers and Creators Council</p>
            </td>
          </tr>
        </table>

        <!-- Content card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:${BRAND.bg};">
          <tr>
            <td style="padding:40px 32px;">
              ${eyebrow}
              ${subjectHtml}
              ${bodyHtml}
              ${ctaHtml}
              ${signatureHtml}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:16px auto 0;">
          <tr>
            <td align="left" style="padding:0 8px;">
              <p style="margin:0;font-family:${FONT_STACK};font-size:11px;line-height:1.55;color:${BRAND.inverseSubtle};">
                Content Developers and Creators Council ·
                <a href="https://cdcc.org.za" style="color:${BRAND.inverseSubtle};text-decoration:underline;">cdcc.org.za</a>
              </p>
              <p style="margin:6px 0 0;font-family:${FONT_STACK};font-size:11px;line-height:1.55;color:${BRAND.inverseSubtle};">
                A DSAC Cultural &amp; Creative Industries Cluster.
              </p>
              ${unsubscribeHtml}
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text alternative
  const textParts: string[] = [];
  if (opts.eyebrow) textParts.push(opts.eyebrow.toUpperCase());
  textParts.push(opts.subject);
  textParts.push('');
  textParts.push(plainTextFromBody(opts.body));
  if (opts.cta) {
    textParts.push('');
    textParts.push(`${opts.cta.label}: ${opts.cta.href}`);
  }
  if (opts.signature) {
    textParts.push('');
    textParts.push('---');
    textParts.push(opts.signature.replace(/<[^>]+>/g, '').trim());
  }
  textParts.push('');
  textParts.push('---');
  textParts.push('Content Developers and Creators Council · cdcc.org.za');
  textParts.push('A DSAC Cultural & Creative Industries Cluster.');
  if (opts.unsubscribe) {
    textParts.push('');
    textParts.push(
      `Unsubscribe: ${opts.unsubscribe.baseUrl}/newsletter/unsubscribe/${opts.unsubscribe.token}`,
    );
  }

  return {
    html,
    text: textParts.join('\n'),
  };
}
