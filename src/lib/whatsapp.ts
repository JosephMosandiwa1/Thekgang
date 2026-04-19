/**
 * WhatsApp Business Cloud API helper (Meta).
 *
 * Environment variables (add when keys are provided):
 *   WHATSAPP_PHONE_NUMBER_ID=<from Meta for Developers dashboard>
 *   WHATSAPP_ACCESS_TOKEN=<permanent access token>
 *
 * Without creds, sendWhatsApp() logs a preview and returns {ok: true, preview: true}.
 */

const API_BASE = 'https://graph.facebook.com/v20.0';

export interface WhatsAppMessage {
  to: string;                // e.g. "+27821234567" or "27821234567"
  body: string;              // plain text body
}

export interface WhatsAppResult {
  ok: boolean;
  preview?: boolean;
  messageId?: string;
  error?: string;
}

function normaliseRecipient(to: string): string {
  return to.replace(/[^\d]/g, '');
}

export async function sendWhatsApp(msg: WhatsAppMessage): Promise<WhatsAppResult> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.info('\n[whatsapp preview — WHATSAPP_* env vars not set]');
    console.info(`  TO:   ${msg.to}`);
    console.info(`  BODY: ${msg.body.slice(0, 160)}${msg.body.length > 160 ? '…' : ''}`);
    return { ok: true, preview: true };
  }

  try {
    const res = await fetch(`${API_BASE}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normaliseRecipient(msg.to),
        type: 'text',
        text: { body: msg.body },
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Send a template-style event reminder — compact for SMS/WhatsApp.
 */
export function templateEventReminder(opts: { eventTitle: string; dateLabel: string; venue?: string | null; url: string }): string {
  const parts = [
    `📅 ${opts.eventTitle}`,
    opts.dateLabel,
    opts.venue ? `📍 ${opts.venue}` : '',
    `Details: ${opts.url}`,
    '— CDCC',
  ].filter(Boolean);
  return parts.join('\n');
}
