import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Browser-side Supabase client with cookie-based auth persistence.
 * Sessions survive across server-rendered page navigations because
 * createBrowserClient writes to cookies that the middleware + server
 * client can read.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? (createBrowserClient(supabaseUrl, supabaseAnonKey) as unknown as SupabaseClient)
    : null;

/**
 * Legacy: plain browser client (no cookie sync). Kept for any call sites
 * that specifically need a non-cookie-synced client (rare).
 */
export function legacyBrowserClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
