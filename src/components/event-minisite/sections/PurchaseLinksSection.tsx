'use client';

import type { SectionProps } from '../SectionRegistry';

export default function PurchaseLinksSection({ event }: SectionProps) {
  const links: any[] = event.book_details?.purchase_links || [];
  if (!links.length) return null;

  return (
    <section id="purchase_links" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Purchase</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-4 type-grow">Get Your Copy</h2>
        {event.book_details?.title && <p className="text-base text-black/50 italic mb-10">{event.book_details.title}</p>}

        <div className="flex flex-wrap justify-center gap-4">
          {links.map((link, i) => (
            <a key={i} href={link.url} target="_blank" rel="noopener" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3.5">
              {link.label || 'Buy Now'}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
