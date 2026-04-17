'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';
import { TicketQR } from '../../EventFeatures';

const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];

export default function RegistrationSection({ event }: SectionProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', province: '', organisation: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ code: string } | null>(null);
  const [error, setError] = useState('');
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - (event._regCount || 0)) : null;

  useEffect(() => {
    supabase!.from('event_ticket_types').select('*').eq('event_id', event.id).order('price').then(({ data }) => {
      if (data?.length) { setTickets(data); setSelectedTicket(data[0].id); }
    });
  }, [event.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    const code = `${event.slug || 'EVT'}-${Date.now().toString(36).toUpperCase()}`;
    const { error: err } = await supabase!.from('event_registrations').insert({
      event_id: event.id, ticket_type_id: selectedTicket, name: form.name,
      email: form.email, phone: form.phone, province: form.province,
      organisation: form.organisation, confirmation_code: code, status: 'confirmed',
    });
    setSubmitting(false);
    if (err) { setError('Registration failed. Please try again.'); return; }
    setSuccess({ code });
  }

  if (event._isPast) return null;

  return (
    <section id="registration" className="py-24 md:py-32 px-6 bg-black text-white">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Register</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-4 type-grow">Secure Your Spot</h2>
        {spotsLeft !== null && <p className="text-sm text-white/50 mb-10">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining</p>}

        {success ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <p className="text-lg text-white/80">You are registered.</p>
            <TicketQR code={success.code} eventTitle={event.title} />
            <p className="text-xs text-white/40">A confirmation has been sent to {form.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {tickets.length > 1 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {tickets.map(t => (
                  <button type="button" key={t.id} onClick={() => setSelectedTicket(t.id)}
                    className={`px-4 py-2 rounded border text-xs uppercase tracking-wider transition-colors ${selectedTicket === t.id ? 'bg-white text-black border-white' : 'border-white/20 text-white/50 hover:border-white/40'}`}>
                    {t.name} {t.price > 0 ? `— R${t.price}` : '— Free'}
                  </button>
                ))}
              </div>
            )}
            <input type="text" placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none" />
            <input type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none" />
            <input type="tel" placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none" />
            <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none">
              <option value="" className="text-black">Province</option>
              {PROVINCES.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
            </select>
            <input type="text" placeholder="Organisation" value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/40 focus:outline-none" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-3.5 w-full disabled:opacity-50">
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
