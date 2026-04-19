/**
 * Paystack helper.
 *
 * The flow we use:
 *   1. Client calls POST /api/billing/initiate -> returns Paystack access_code
 *   2. Client opens Paystack inline popup with the access_code
 *   3. User pays, Paystack calls webhook (POST /api/billing/webhook)
 *   4. Webhook verifies signature, marks member_payment as 'success',
 *      activates/extends member_subscriptions row
 *
 * Environment variables required (add to .env.local when you get the keys):
 *   PAYSTACK_SECRET_KEY=sk_live_xxx   (or sk_test_xxx)
 *   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
 *   PAYSTACK_WEBHOOK_SECRET=<same as secret key — Paystack signs webhooks with this>
 */

export const PAYSTACK_API = 'https://api.paystack.co';

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

export async function paystackPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = paystackSecret();
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not configured');
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function paystackGet<T = unknown>(path: string): Promise<T> {
  const key = paystackSecret();
  if (!key) throw new Error('PAYSTACK_SECRET_KEY not configured');
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface PaystackInitialiseResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackTxn {
  id: number;
  reference: string;
  amount: number;         // kobo / cents
  status: string;
  paid_at: string | null;
  channel: string;
  authorization?: {
    authorization_code: string;
    card_type: string | null;
  };
  customer: {
    customer_code: string;
    email: string;
  };
  metadata: Record<string, unknown>;
}

export interface PaystackVerifyResponse {
  status: boolean;
  data: PaystackTxn;
}

/**
 * Verify webhook signature (constant-time compare).
 * Paystack signs each webhook with HMAC-SHA512 using your secret key.
 */
export async function verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
  const key = paystackSecret();
  if (!key || !signature) return false;
  // Use Web Crypto (available in Node 20+ and Next.js edge runtime)
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
  // Timing-safe compare
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}
