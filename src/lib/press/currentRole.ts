/**
 * The Press · currentRole — reads the active user's Press role.
 *
 * Client-side reader. Looks up `user_roles.role` for the authenticated
 * `auth.uid()`; falls back to 'ed' for the first seeded admin when no
 * row exists yet (so the shell works from day one).
 *
 * Server-side callers should use the SQL helper
 * `public.press_current_role()` defined in 020_press_roles.sql.
 */

import { supabase } from '@/lib/supabase/client';
import type { PressRole } from './roles';

export async function readCurrentRole(): Promise<PressRole | null> {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return null;
  if (!data) {
    // No role row yet. Default the first admin to ED so the shell
    // is reachable; the bootstrap migration can upgrade later.
    return 'ed';
  }
  return data.role as PressRole;
}
