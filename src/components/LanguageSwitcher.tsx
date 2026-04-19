'use client';

import { useState, useEffect, useRef } from 'react';
import { SA_LANGUAGES, type SALangCode, DEFAULT_LANG } from '@/lib/i18n';

const COOKIE = 'NEXT_LOCALE';

export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState<SALangCode>(DEFAULT_LANG);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
    if (match) setLang(match[1] as SALangCode);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function pick(code: SALangCode) {
    setLang(code);
    document.cookie = `${COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    // Soft reload so server components re-render with new cookie
    window.location.reload();
  }

  const current = SA_LANGUAGES.find((l) => l.code === lang) || SA_LANGUAGES[0];

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-black transition-colors flex items-center gap-1"
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{lang.toUpperCase()}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div role="listbox" aria-label="Languages" className="absolute right-0 top-full mt-2 bg-white border border-gray-200 min-w-[180px] z-50 shadow-sm">
          {SA_LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${l.code === current.code ? 'font-semibold bg-gray-50' : ''}`}
            >
              <span className="font-mono text-[10px] text-gray-400 mr-2 uppercase">{l.code}</span>
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
