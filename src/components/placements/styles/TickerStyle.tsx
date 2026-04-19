'use client';

import Link from 'next/link';
import { type DisplayPayload } from '@/lib/placements';

interface TickerProps {
  items: { placement_id: number; payload: DisplayPayload }[];
  theme?: 'light' | 'dark';
}

export function TickerRow({ items, theme = 'dark' }: TickerProps) {
  if (items.length === 0) return null;
  const bg = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black border-t border-gray-200';
  return (
    <div className={`${bg} fixed bottom-0 left-0 right-0 z-40 overflow-hidden`} style={{ height: 36 }}>
      <div className="ticker-inner flex items-center h-full gap-12 whitespace-nowrap text-xs" style={{ animation: 'ticker-scroll 45s linear infinite' }}>
        {[...items, ...items].map((it, i) => (
          <Link key={`${it.placement_id}-${i}`} href={it.payload.cta_url} className="flex items-center gap-3 hover:opacity-80">
            {it.payload.eyebrow && <span className="opacity-60 uppercase tracking-wider">{it.payload.eyebrow}</span>}
            <span><strong>{it.payload.title}</strong>{it.payload.subtitle && ` · ${it.payload.subtitle}`}</span>
            <span className="opacity-40">→</span>
          </Link>
        ))}
      </div>
      <style>{`@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
