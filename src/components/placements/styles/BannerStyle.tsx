'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { type StyleProps, THEME_CLASSES, buildStyle } from './styles-shared';

const DISMISS_KEY_PREFIX = 'cdcc_banner_dismissed_';

export function BannerStyle({ placement_id, payload, theme, ...rest }: StyleProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY_PREFIX + placement_id)) setDismissed(true);
  }, [placement_id]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY_PREFIX + placement_id, '1');
    setDismissed(true);
    // Fire-and-forget analytics
    fetch('/api/placements/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placement_id, event: 'dismiss' }),
    }).catch(() => undefined);
  }

  if (dismissed) return null;

  return (
    <div className={cn('w-full px-4 py-3 text-sm flex items-center justify-between gap-4', THEME_CLASSES[theme])} style={buildStyle(rest)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {payload.eyebrow && <span className="text-[10px] uppercase tracking-wider opacity-70 shrink-0">{payload.eyebrow}</span>}
        <span className="truncate">
          <strong>{payload.title}</strong>
          {payload.subtitle && <span className="opacity-80"> · {payload.subtitle}</span>}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href={payload.cta_url} className="text-xs uppercase tracking-wider underline hover:no-underline whitespace-nowrap">
          {payload.cta_text} →
        </Link>
        <button onClick={dismiss} aria-label="Dismiss" className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
      </div>
    </div>
  );
}
