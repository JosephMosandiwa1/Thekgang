'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type StyleProps, THEME_CLASSES, buildStyle } from './styles-shared';

interface ModalProps extends StyleProps {
  frequency: 'once' | 'daily' | 'session' | 'always';
}

export function ModalStyle({ placement_id, payload, theme, frequency, ...rest }: ModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `cdcc_modal_${placement_id}`;
    if (frequency === 'once') {
      if (localStorage.getItem(key)) return;
    } else if (frequency === 'session') {
      if (sessionStorage.getItem(key)) return;
    } else if (frequency === 'daily') {
      const last = localStorage.getItem(key);
      if (last && Date.now() - Number(last) < 24 * 60 * 60 * 1000) return;
    }
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [placement_id, frequency]);

  function close() {
    setOpen(false);
    const key = `cdcc_modal_${placement_id}`;
    const now = String(Date.now());
    if (frequency === 'once' || frequency === 'daily') localStorage.setItem(key, now);
    if (frequency === 'session') sessionStorage.setItem(key, now);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={close}>
      <div
        className={cn('relative max-w-xl w-full p-10', THEME_CLASSES[theme])}
        style={buildStyle(rest)}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} aria-label="Close" className="absolute top-3 right-3 text-2xl opacity-60 hover:opacity-100 leading-none">×</button>
        {payload.image_url && (
          <div className="-mx-10 -mt-10 mb-6 aspect-[16/9] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payload.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-3">{payload.eyebrow}</p>}
        <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">{payload.title}</h2>
        {payload.subtitle && <p className="text-lg opacity-80 mt-3">{payload.subtitle}</p>}
        {payload.body && <p className="text-sm opacity-70 mt-4">{payload.body}</p>}
        <div className="mt-6 flex gap-3">
          <Link href={payload.cta_url} onClick={close} className="bg-current text-white px-6 py-3 text-xs uppercase tracking-wider hover:opacity-80" style={{ color: 'white' }}>
            <span style={{ mixBlendMode: 'difference' }}>{payload.cta_text} →</span>
          </Link>
          <button onClick={close} className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100">No thanks</button>
        </div>
      </div>
    </div>
  );
}
