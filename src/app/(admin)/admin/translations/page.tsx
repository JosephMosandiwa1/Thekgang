'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SA_LANGUAGES, type SALangCode } from '@/lib/i18n';
import { supabaseErrorMessage } from '@/lib/utils';

interface Row { id?: number; key: string; lang: SALangCode; value: string; domain: string }

const DOMAINS = ['general', 'nav', 'cta', 'forms', 'events', 'emails'];

export default function AdminTranslations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('general');
  const [lang, setLang] = useState<SALangCode>('zu');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, [domain]);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('translations').select('*').eq('domain', domain).order('key');
    setRows(((data || []) as unknown) as Row[]);
    setLoading(false);
  }

  async function saveCell(key: string, langCode: SALangCode, value: string) {
    if (!supabase) return;
    const { error } = await supabase.from('translations').upsert({ key, lang: langCode, value, domain }, { onConflict: 'key,lang,domain' });
    if (error) setMessage(supabaseErrorMessage(error));
    else { setMessage('Saved.'); load(); }
  }

  async function addKey() {
    if (!newKey.trim()) return;
    await saveCell(newKey, 'en', newValue);
    setNewKey(''); setNewValue('');
  }

  async function delKey(key: string) {
    if (!supabase || !window.confirm(`Delete all translations of "${key}"?`)) return;
    await supabase.from('translations').delete().eq('key', key).eq('domain', domain);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  // Group rows by key
  const keys = Array.from(new Set(rows.map((r) => r.key))).sort();
  const byKeyLang = new Map<string, string>();
  rows.forEach((r) => byKeyLang.set(`${r.key}:${r.lang}`, r.value));

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Translations</h1>
      <p className="text-sm text-gray-500 mb-6">11 SA official languages · key-value strings grouped by domain</p>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={domain} onChange={(e) => setDomain(e.target.value)} className="px-3 py-2 border border-gray-200 text-sm">
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex items-center gap-2 text-xs ml-2">Focus on:
          <select value={lang} onChange={(e) => setLang(e.target.value as SALangCode)} className="px-2 py-1.5 border border-gray-200 text-sm">
            {SA_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="new.key.path" className="flex-1 px-3 py-2 border border-gray-200 text-sm font-mono" />
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="English default" className="flex-1 px-3 py-2 border border-gray-200 text-sm" />
        <button onClick={addKey} className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2">+ Add key</button>
      </div>

      {message && <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-sm">{message}</div>}

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Key</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">English (en)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">{SA_LANGUAGES.find((l) => l.code === lang)?.name} ({lang})</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className="border-b border-gray-100">
                <td className="px-4 py-3 font-mono text-xs align-top">{k}</td>
                <td className="px-4 py-3 align-top">
                  <Cell initial={byKeyLang.get(`${k}:en`) || ''} onSave={(v) => saveCell(k, 'en', v)} />
                </td>
                <td className="px-4 py-3 align-top">
                  <Cell initial={byKeyLang.get(`${k}:${lang}`) || ''} onSave={(v) => saveCell(k, lang, v)} placeholder="—" />
                </td>
                <td className="px-4 py-3 text-right align-top"><button onClick={() => delKey(k)} className="text-xs text-red-700 hover:underline">Del</button></td>
              </tr>
            ))}
            {keys.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No keys in this domain yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ initial, onSave, placeholder }: { initial: string; onSave: (v: string) => void; placeholder?: string }) {
  const [v, setV] = useState(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setV(initial); setDirty(false); }, [initial]);
  return (
    <div className="flex gap-2 items-start">
      <input value={v} onChange={(e) => { setV(e.target.value); setDirty(true); }} placeholder={placeholder} className="flex-1 px-2 py-1.5 border border-gray-200 text-sm" />
      {dirty && <button onClick={() => onSave(v)} className="text-xs bg-black text-white px-2 py-1">Save</button>}
    </div>
  );
}
