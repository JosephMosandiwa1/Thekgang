'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import DedicatedEventPage from '@/components/DedicatedEventPage';

interface EventFull {
  id: number; title: string; slug: string; tagline: string; event_type: string; format: string;
  event_date: string; event_time: string; end_date: string; venue: string; venue_address: string;
  capacity: number; status: string; description: string; cover_image_url: string;
  programme_schedule: any[]; speakers: any[]; sponsors: any[]; recording_url: string;
  gallery_urls: string[]; feedback_enabled: boolean; registration_required: boolean; is_dedicated: boolean;
  documents: any[]; virtual_link: string;
}

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [regCount, setRegCount] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', organisation: '', province: '', joinRegistry: false });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => { load(); }, [params.id]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const isNumeric = /^\d+$/.test(params.id);
    let data: any = null;
    if (!isNumeric) {
      const res = await supabase.from('events').select('*').eq('slug', params.id).single();
      data = res.data;
    }
    if (!data) {
      const res = await supabase.from('events').select('*').eq('id', parseInt(params.id) || 0).single();
      data = res.data;
    }
    setEvent(data as EventFull);
    if (data) {
      const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', data.id);
      setRegCount(count || 0);
    }
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !event || !form.name || !form.email) return;
    setSubmitting(true);
    const qrCode = `CDCC-${event.id}-${Date.now().toString(36)}`;
    const isWaitlisted = event.capacity ? regCount >= event.capacity : false;
    await supabase.from('event_registrations').insert({
      event_id: event.id, name: form.name, email: form.email, phone: form.phone || null,
      organisation: form.organisation || null, province: form.province || null,
      qr_code: qrCode, waitlisted: isWaitlisted,
    });
    if (form.joinRegistry) {
      await supabase.from('constituency_submissions').insert({
        name: form.name, email: form.email, phone: form.phone || null,
        province: form.province || null, organisation: form.organisation || null,
        constituency_type: 'other', status: 'new',
        utm_source: 'event_registration', utm_campaign: event.slug || String(event.id),
      });
    }
    setSubmitting(false);
    setRegistered(true);
  }

  if (loading) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-400">Loading...</p></div>;
  if (!event) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500">Event not found.</p><Link href="/events" className="text-xs text-black mt-4 inline-block">&larr; All events</Link></div>;

  const isPast = event.event_date < new Date().toISOString().split('T')[0];
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - regCount) : null;

  if (event.is_dedicated) {
    return <DedicatedEventPage event={event as any} regCount={regCount} />;
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/events" className="text-xs text-gray-500 hover:text-black transition-colors">&larr; All Events</Link>
        <div className="flex items-center gap-3 mt-6 mb-2">
          {event.event_type && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-black/20 text-gray-500/60 rounded">{event.event_type}</span>}
          {event.format && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 text-gray-500 rounded">{event.format}</span>}
        </div>
        <p className="text-xs text-black font-medium mb-2">{new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}</p>
        <h1 className="font-display text-3xl font-bold text-black tracking-tight mb-4">{event.title}</h1>
        {event.venue && <p className="text-sm text-gray-500 mb-2">{event.venue}{event.venue_address ? `, ${event.venue_address}` : ''}</p>}
        {spotsLeft !== null && !isPast && <p className="text-xs text-gray-500/70 mb-6">{spotsLeft} of {event.capacity} spots remaining</p>}
        {event.description && <div className="text-sm text-black/70 leading-relaxed mb-12 whitespace-pre-wrap">{event.description}</div>}

        {isPast && event.recording_url && (
          <div className="border border-black/20 bg-black/5 rounded p-6 mb-8 text-center">
            <p className="text-sm font-medium text-black mb-2">Event recording available</p>
            <a href={event.recording_url} target="_blank" rel="noopener" className="bg-black text-black text-xs tracking-[0.15em] uppercase font-semibold px-6 py-2 rounded inline-block hover:bg-black/90 transition-colors">Watch Recording &rarr;</a>
          </div>
        )}

        <div className="mb-8">
          <a href={`/api/events/${event.id}/calendar`} className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 text-xs tracking-[0.1em] uppercase px-4 py-2 rounded hover:border-black hover:text-black transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
            Add to Calendar
          </a>
        </div>

        {!isPast && event.registration_required !== false && !registered && (
          <div className="border border-gray-200/50 rounded p-8 bg-white">
            <h2 className="font-display text-lg font-bold text-black mb-4">Register for this event</h2>
            <form onSubmit={handleRegister} className="space-y-3 max-w-md">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={form.joinRegistry} onChange={e => setForm(f => ({ ...f, joinRegistry: e.target.checked }))} className="w-4 h-4 mt-0.5 accent-gold" /><div><p className="text-sm text-black">Also join the CDCC Council</p><p className="text-xs text-gray-500">Get represented in national policy</p></div></label>
              <button type="submit" disabled={submitting} className="w-full bg-black text-white text-xs font-semibold tracking-[0.15em] uppercase py-3 rounded disabled:opacity-50 hover:bg-black/90 transition-colors">{submitting ? 'Registering...' : 'Register'}</button>
            </form>
          </div>
        )}

        {registered && (
          <div className="border border-green-600/30 bg-green-600/5 rounded p-8 text-center">
            <p className="font-display text-lg font-bold text-black mb-2">You&apos;re registered!</p>
            <p className="text-sm text-gray-500">Confirmation sent to {form.email}.</p>
            {form.joinRegistry && <p className="text-xs text-gray-500 mt-2">You&apos;ve also been added to the CDCC registry.</p>}
            <a href={`/api/events/${event.id}/calendar`} className="inline-flex items-center gap-2 mt-4 border border-gray-200 text-gray-500 text-xs tracking-[0.1em] uppercase px-4 py-2 rounded hover:border-black hover:text-black transition-colors">
              Add to Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
