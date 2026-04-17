'use client';

import { useState } from 'react';
import type { SectionProps } from '../SectionRegistry';

export default function FAQSection({ event }: SectionProps) {
  const faqs: { question: string; answer: string }[] = Array.isArray(event.faq) ? event.faq : [];
  const [open, setOpen] = useState<number | null>(null);

  if (!faqs.length) return null;

  return (
    <section id="faq" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">FAQ</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Frequently Asked Questions</h2>

        <div className="divide-y divide-gray-200">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-5 text-left group">
                <span className="text-base font-medium text-black pr-4">{faq.question}</span>
                <span className="text-xl text-black/30 shrink-0 group-hover:text-black transition-colors">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="pb-5 pr-8">
                  <p className="text-sm text-black/70 leading-[1.8]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
