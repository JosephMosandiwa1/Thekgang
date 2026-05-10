/**
 * spam.ts — defensive helpers for public form endpoints.
 *
 * Two layers:
 *   1. Honeypot field: a hidden input named `website_url` (humans never
 *      see or fill it; bots auto-fill any field). If filled, reject 422.
 *   2. In-memory per-IP + per-email rate limit: max 5 requests in any
 *      60-second window per (ip, route, email). Reject 429.
 *
 * The rate-limit map is process-local — fine on Vercel where each
 * cold-start has its own scope; spam waves get throttled even if one
 * region resets. For high-traffic, swap for an upstash KV or Supabase
 * RPC backed by a small `rate_limit_log` table.
 *
 * Designed to live alongside Cloudflare Turnstile when CDCC has a
 * Cloudflare account configured. Until then, this is the floor.
 */

import { NextRequest } from 'next/server';

const HONEYPOT_FIELD = 'website_url';
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

export const HONEYPOT_NAME = HONEYPOT_FIELD;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const ipBucket: Map<string, RateLimitEntry> = new Map();

function bucketKey(route: string, ip: string, email: string | null): string {
  return `${route}::${ip}::${(email || '').toLowerCase()}`;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns `null` if the request passes spam checks.
 * Returns `{ status, error }` if it should be rejected.
 *
 * Call from any POST handler:
 *
 *   const blocked = checkSpam(req, body, { route: '/api/contact', email: body.email });
 *   if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });
 */
export function checkSpam(
  req: NextRequest,
  body: Record<string, unknown> | null,
  opts: { route: string; email?: string | null },
): { status: number; error: string } | null {
  // 1. Honeypot
  if (body && typeof body[HONEYPOT_FIELD] === 'string' && (body[HONEYPOT_FIELD] as string).trim().length > 0) {
    return { status: 422, error: 'Submission rejected.' };
  }

  // 2. Rate limit
  const ip = clientIp(req);
  const key = bucketKey(opts.route, ip, opts.email ?? null);
  const now = Date.now();
  const entry = ipBucket.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipBucket.set(key, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
    if (entry.count > MAX_PER_WINDOW) {
      return { status: 429, error: 'Too many submissions. Please wait a minute and try again.' };
    }
  }

  // Periodic GC so the map doesn't grow forever.
  if (ipBucket.size > 10_000) {
    Array.from(ipBucket.entries()).forEach(([k, v]) => {
      if (now - v.windowStart > WINDOW_MS * 5) ipBucket.delete(k);
    });
  }

  return null;
}
