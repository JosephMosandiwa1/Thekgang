'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function TicketsSection({ event }: SectionProps) {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    supabase!.from('event_ticket_types').select('*').eq('event_id', event.id).order('price').then(({ data }) => {
      if (data) setTickets(data);
    });
  }, [event.id]);

  if (!tickets.length) return null;

  function scrollToReg() {
    document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section id="tickets" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Tickets</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Tickets</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-6 card-hover flex flex-col">
              <h3 className="font-display text-lg font-semibold text-black">{t.name}</h3>
              <div className="mt-3">
                <span className="font-display text-3xl font-bold text-black">
                  {t.price > 0 ? `R${t.price}` : 'Free'}
                </span>
              </div>
              {t.description && <p className="text-sm text-black/60 leading-relaxed mt-3 flex-1">{t.description}</p>}
              {t.quantity_remaining !== null && t.quantity_remaining !== undefined && (
                <p className="text-xs text-black/40 mt-3">{t.quantity_remaining} remaining</p>
              )}
              <button onClick={scrollToReg} className="btn-ink text-[10px] uppercase tracking-[0.15em] px-6 py-2.5 w-full mt-4">
                {event._isPast ? 'Sold Out' : 'Register'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
