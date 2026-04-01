'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface EventDetail { id: number; title: string; description: string; event_date: string; event_time: string; venue: string; venue_address: string; capacity: number; registration_required: boolean }

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', organisation: '', province: '' });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => { load(); }, [params.id]);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('events').select('*').eq('id', params.id).single();
    setEvent(data as EventDetail);
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !form.name || !form.email) return;
    setSubmitting(true);
    await supabase.from('event_registrations').insert({ event_id: parseInt(params.id), name: form.name, email: form.email, phone: form.phone || null, organisation: form.organisation || null, province: form.province || null });
    setSubmitting(false);
    setRegistered(true);
  }

  if (loading) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500">Loading...</p></div>;
  if (!event) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500">Event not found.</p><Link href="/events" className="text-black text-xs mt-4 inline-block">&larr; Back to events</Link></div>;

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/events" className="text-xs text-gray-500 hover:text-black transition-colors">&larr; All Events</Link>
        <p className="text-xs text-black font-medium mt-6 mb-2">{new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}</p>
        <h1 className="font-display text-3xl font-bold text-black tracking-tight mb-4">{event.title}</h1>
        {event.venue && <p className="text-sm text-gray-500 mb-2">{event.venue}{event.venue_address ? `, ${event.venue_address}` : ''}</p>}
        {event.capacity && <p className="text-xs text-gray-500/50 mb-6">{event.capacity} seats available</p>}
        {event.description && <div className="text-sm text-black/70 leading-relaxed mb-12 whitespace-pre-wrap">{event.description}</div>}

        {event.registration_required !== false && !registered && (
          <div className="border border-gray-200/50 rounded p-8 bg-white">
            <h2 className="font-display text-lg font-bold text-black mb-4">Register for this event</h2>
            <form onSubmit={handleRegister} className="space-y-3 max-w-md">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation (optional)" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <button type="submit" disabled={submitting} className="w-full bg-black text-white text-xs font-medium tracking-[0.15em] uppercase py-3 hover:bg-black-light transition-colors rounded disabled:opacity-50">
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        )}

        {registered && (
          <div className="border border-green-600/30 bg-green-600/5 rounded p-8 text-center">
            <p className="font-display text-lg font-bold text-black mb-2">You&apos;re registered!</p>
            <p className="text-sm text-gray-500">We&apos;ll send a confirmation to {form.email}. See you there.</p>
          </div>
        )}
      </div>
    </div>
  );
}
