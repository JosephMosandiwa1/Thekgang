/**
 * Tiny Mustache-style template renderer for the admin-editable
 * email_templates registry table (migration 036).
 *
 * Supports `{{name}}` substitution. Missing vars render as empty
 * strings (not the literal `{{var}}`) so half-filled forms don't leak
 * placeholder syntax into outbound emails.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResolvedTemplate {
  id: string;
  key: string;
  version: number;
  subject: string;
  body: string;
  category: string;
}

const TOKEN = /\{\{\s*([a-zA-Z0-9_.\- ]+?)\s*\}\}/g;

export function renderTemplate(
  subjectTpl: string,
  bodyTpl: string,
  vars: Record<string, string | number | null | undefined>,
): { subject: string; body: string; varsUsed: string[] } {
  const used = new Set<string>();
  const expand = (tpl: string) =>
    tpl.replace(TOKEN, (_, key: string) => {
      const k = key.trim();
      used.add(k);
      const v = vars[k];
      return v == null ? '' : String(v);
    });
  return {
    subject: expand(subjectTpl).trim(),
    body: expand(bodyTpl),
    varsUsed: Array.from(used),
  };
}

/**
 * Look up a template by `key`. If no version is given, returns the
 * highest active version. Returns null when nothing matches — the
 * caller should fall back to a TS-module template.
 */
export async function loadTemplateByKey(
  sb: SupabaseClient,
  key: string,
  version?: number,
): Promise<ResolvedTemplate | null> {
  let q = sb
    .from('email_templates')
    .select('id,key,version,subject,body,category')
    .eq('key', key)
    .eq('is_active', true)
    .order('version', { ascending: false });
  if (typeof version === 'number') {
    q = q.eq('version', version);
  }
  const { data } = await q.limit(1);
  return ((data ?? [])[0] as ResolvedTemplate | undefined) ?? null;
}

/**
 * Surface the placeholder list for a template body — useful for the
 * admin UI to validate that all `{{var}}` markers have substitutions
 * available before sending.
 */
export function listPlaceholders(subjectTpl: string, bodyTpl: string): string[] {
  const found = new Set<string>();
  for (const tpl of [subjectTpl, bodyTpl]) {
    const matches = Array.from(tpl.matchAll(TOKEN));
    for (const m of matches) found.add(m[1].trim());
  }
  return Array.from(found).sort();
}
