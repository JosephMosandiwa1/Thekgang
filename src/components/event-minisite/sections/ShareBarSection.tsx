'use client';

import { useState } from 'react';
import type { SectionProps } from '../SectionRegistry';

export default function ShareBarSection({ event }: SectionProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title = event.title || '';
  const date = event.event_date ? new Date(event.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const waText = encodeURIComponent(`${title}${date ? ` - ${date}` : ''}\n${url}`);
  const emailSubject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(`Check out this event: ${title}\n\n${url}`);

  return (
    <section id="share_bar" className="py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-black/30 mr-2">Share</span>

        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2 border border-gray-200 rounded hover:border-black/30 hover:bg-black hover:text-white transition-colors">
          WhatsApp
        </a>

        <button onClick={copyLink}
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2 border border-gray-200 rounded hover:border-black/30 hover:bg-black hover:text-white transition-colors">
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        <a href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          className="inline-flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2 border border-gray-200 rounded hover:border-black/30 hover:bg-black hover:text-white transition-colors">
          Email
        </a>
      </div>
    </section>
  );
}
