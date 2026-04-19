/**
 * i18n scaffold for 11 SA official languages.
 *
 * Usage:
 *   import { t } from '@/lib/i18n';
 *   t('nav.about', 'en') -> 'About'
 *   t('nav.about', 'zu') -> 'Ngathi'  (when translations are filled in via admin)
 *
 * Translations are keyed by (key, lang, domain) in the `translations` table.
 * This is a thin wrapper — fetches + caches. For server components, fetch
 * the translation map at page level and pass into components.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const SA_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'st', name: 'Sesotho' },
  { code: 'tn', name: 'Setswana' },
  { code: 'nso', name: 'Sepedi' },
  { code: 've', name: 'Tshivenda' },
  { code: 'ts', name: 'Xitsonga' },
  { code: 'ss', name: 'siSwati' },
  { code: 'nr', name: 'isiNdebele' },
] as const;

export type SALangCode = typeof SA_LANGUAGES[number]['code'];

export const DEFAULT_LANG: SALangCode = 'en';

/**
 * Fetch all translations for a given language + domain, returning a map.
 */
export async function loadTranslations(
  supabase: SupabaseClient,
  lang: SALangCode,
  domain: string = 'general'
): Promise<Record<string, string>> {
  const { data } = await supabase.from('translations').select('key, value').eq('lang', lang).eq('domain', domain);
  const map: Record<string, string> = {};
  for (const row of (data || []) as { key: string; value: string }[]) {
    map[row.key] = row.value;
  }
  return map;
}

/**
 * Synchronous lookup — takes a preloaded translation map.
 */
export function t(map: Record<string, string>, key: string, fallback: string): string {
  return map[key] || fallback;
}
