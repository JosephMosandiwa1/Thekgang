import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Plain server-side Supabase client (no cookie-based auth).
 * Safe for public data reads. Synchronous — returns the client or null.
 *
 * Usage in Server Components / Route Handlers that don't need session context:
 *   const supa = getSupabase();
 *   if (!supa) return notFound();
 *   const { data } = await supa.from('events').select('*');
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client WITH cookie-based auth persistence.
 * Use this when you need the logged-in user's session.
 *
 * Usage:
 *   const supa = await getServerSupabase();
 *   const { data: { user } } = await supa.auth.getUser();
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* server components can't mutate cookies — middleware handles refresh */
        }
      },
    },
  }) as unknown as SupabaseClient;
}
