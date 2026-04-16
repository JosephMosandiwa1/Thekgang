'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   Event Page — handles both slug and ID routes
   /events/power-of-authors-2025 (slug) → dedicated page
   /events/123 (id) → simple or dedicated based on is_dedicated flag
   ============================================================ */

interface EventFull {
  id: number; title: string; slug: string; tagline: string; event_type: string; format: string;
  event_date: string; event_time: string; end_date: string; venue: string; venue_address: string;
  capacity: number; status: string; description: string; cover_image_url: string;
  programme_schedule: any[]; speakers: any[]; sponsors: any[]; recording_url: string;
  gallery_urls: string[]; feedback_enabled: boolean; registration_required: boolean; is_dedicated: boolean;
}

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape'];

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [regCount, setRegCount] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', organisation: '', province: '', joinRegistry: false });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [fbForm, setFbForm] = useState({ name: '', rating: 5, highlights: '', improvements: '', would_recommend: true });
  const [fbSubmitted, setFbSubmitted] = useState(false);

  useEffect(() => { load(); }, [params.id]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    // Try as slug first, then as numeric ID
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

    // Bridge to constituency registry
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

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !event) return;
    await supabase.from('event_feedback').insert({
      event_id: event.id, name: fbForm.name || null, rating: fbForm.rating,
      highlights: fbForm.highlights || null, improvements: fbForm.improvements || null,
      would_recommend: fbForm.would_recommend,
    });
    setFbSubmitted(true);
  }

  if (loading) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-400">Loading...</p></div>;
  if (!event) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500">Event not found.</p><Link href="/events" className="text-xs text-black mt-4 inline-block">&larr; All events</Link></div>;

  const isPast = event.event_date < new Date().toISOString().split('T')[0];
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - regCount) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const schedule = Array.isArray(event.programme_schedule) ? event.programme_schedule : [];
  const eventSpeakers = Array.isArray(event.speakers) ? event.speakers : [];
  const eventSponsors = Array.isArray(event.sponsors) ? event.sponsors : [];
  const partners = eventSponsors.filter((s: any) => s.type === 'partner');
  const sponsorList = eventSponsors.filter((s: any) => s.type === 'sponsor');
  const supporters = eventSponsors.filter((s: any) => s.type === 'supporter');

  // ── DEDICATED EVENT PAGE (full ANFASA-style) ──
  if (event.is_dedicated) {
    return (
      <div>
        {/* HERO */}
        <section className="relative min-h-[70vh] flex flex-col justify-end px-6 pb-16 bg-charcoal overflow-hidden">
          {event.cover_image_url ? (
            <div className="absolute inset-0">
              <img src={event.cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/40" />
            </div>
          ) : (
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'url(/logos/patt-01-wht.svg)', backgroundRepeat: 'repeat', backgroundSize: '200px' }} />
          )}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(197,161,90,0.06) 0%, transparent 65%)' }} />

          <div className="relative z-10 max-w-5xl mx-auto w-full pt-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gold/30 text-gold/70 rounded">{event.event_type}</span>
              <span className="text-[9px] uppercase tracking-wider px-2 py-1 border border-white/15 text-white/40 rounded">{event.format}</span>
              {isPast && event.recording_url && <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-gold text-white rounded">Recording Available</span>}
            </div>
            <h1 className="font-display font-bold text-white tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 6vw, 72px)' }}>{event.title}</h1>
            {event.tagline && <p className="text-lg text-white/50 mt-4 max-w-2xl">{event.tagline}</p>}
            <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-white/60">
              <span>{new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {event.event_time && <span>{event.event_time.slice(0, 5)}</span>}
              {event.venue && <span>{event.venue}</span>}
              {spotsLeft !== null && !isPast && <span className={spotsLeft <= 10 ? 'text-amber-400' : ''}>{spotsLeft} spots remaining</span>}
            </div>
            <div className="mt-8">
              {isPast && event.recording_url ? (
                <a href={event.recording_url} target="_blank" rel="noopener" className="btn-gold text-xs tracking-[0.15em] uppercase px-8 py-4 inline-block">Watch Recording &rarr;</a>
              ) : !isPast && event.registration_required ? (
                <a href="#register" className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-4 inline-block">{isFull ? 'Join Waitlist' : 'Register Now'}</a>
              ) : null}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent z-10" />
        </section>

        {/* ABOUT */}
        {event.description && (
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">About This Event</p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</div>
            </div>
          </section>
        )}

        {/* PROGRAMME */}
        {schedule.length > 0 && (
          <section id="programme" className="py-16 px-6 bg-paper texture-paper">
            <div className="max-w-4xl mx-auto relative z-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Programme</p>
              <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-8">Schedule</h2>
              <div className="space-y-0">
                {schedule.map((item: any, i: number) => (
                  <div key={i} className="flex gap-6 py-5 border-b rule-gold last:border-0">
                    <span className="text-sm font-mono text-gold/70 w-16 flex-shrink-0 pt-0.5">{item.time}</span>
                    <div><p className="text-base font-semibold text-black">{item.title}</p>{item.speaker && <p className="text-xs text-gray-500 mt-1">{item.speaker}</p>}{item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SPEAKERS */}
        {eventSpeakers.length > 0 && (
          <section id="speakers" className="py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Speakers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventSpeakers.map((sp: any, i: number) => (
                  <div key={i} className="group border border-gray-200/60 rounded p-6 card-hover transition-all">
                    {sp.photo_url && <img src={sp.photo_url} alt={sp.name} className="w-16 h-16 rounded-full object-cover mb-4 img-mono" />}
                    <h3 className="font-display text-base font-bold text-black type-card-title">{sp.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{sp.title}{sp.organisation ? ` — ${sp.organisation}` : ''}</p>
                    {sp.bio && <p className="text-xs text-gray-500 mt-3 leading-relaxed">{sp.bio}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SPONSORS */}
        {eventSponsors.length > 0 && (
          <section className="py-12 px-6 border-y rule-gold">
            <div className="max-w-5xl mx-auto">
              {partners.length > 0 && <div className="mb-8"><p className="text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-4 text-center">Partners</p><div className="flex flex-wrap justify-center gap-8">{partners.map((s: any, i: number) => <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="text-sm font-medium text-black hover:text-gold transition-colors type-breathe">{s.name}</a>)}</div></div>}
              {sponsorList.length > 0 && <div className="mb-8"><p className="text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-4 text-center">Sponsors</p><div className="flex flex-wrap justify-center gap-8">{sponsorList.map((s: any, i: number) => <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="text-sm text-gray-500 hover:text-black transition-colors">{s.name}</a>)}</div></div>}
              {supporters.length > 0 && <div><p className="text-[9px] uppercase tracking-[0.3em] text-gold/50 mb-4 text-center">Supporters</p><div className="flex flex-wrap justify-center gap-6">{supporters.map((s: any, i: number) => <span key={i} className="text-xs text-gray-400">{s.name}</span>)}</div></div>}
            </div>
          </section>
        )}

        {/* REGISTRATION */}
        {!isPast && event.registration_required && (
          <section id="register" className="py-20 px-6 bg-charcoal text-white pattern-overlay-dark relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <div className="max-w-xl mx-auto relative z-10">
              {!registered ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-4 text-center">{isFull ? 'Waitlist' : 'Register'}</p>
                  <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-8 text-center">{isFull ? 'Event full — join the waitlist' : 'Secure your spot'}</h2>
                  {spotsLeft !== null && !isFull && <p className="text-center text-sm text-white/40 mb-6">{spotsLeft} of {event.capacity} spots remaining</p>}
                  <form onSubmit={handleRegister} className="space-y-3">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" required className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 rounded focus:outline-none focus:border-gold" />
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" required className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 rounded focus:outline-none focus:border-gold" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 rounded focus:outline-none focus:border-gold" />
                      <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white rounded focus:outline-none focus:border-gold"><option value="">Province</option>{PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    </div>
                    <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation (optional)" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 rounded focus:outline-none focus:border-gold" />
                    <label className="flex items-start gap-3 cursor-pointer pt-2"><input type="checkbox" checked={form.joinRegistry} onChange={e => setForm(f => ({ ...f, joinRegistry: e.target.checked }))} className="w-4 h-4 mt-0.5" /><div><p className="text-sm text-white/80">Also join the CDCC Council</p><p className="text-xs text-white/30">Get represented in national advocacy and policy</p></div></label>
                    <button type="submit" disabled={submitting} className="w-full btn-gold text-xs tracking-[0.15em] uppercase py-4 mt-2 disabled:opacity-50">{submitting ? 'Registering...' : isFull ? 'Join Waitlist' : 'Register'}</button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg></div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">You&apos;re {isFull ? 'on the waitlist' : 'registered'}!</h2>
                  <p className="text-sm text-white/40">Confirmation sent to {form.email}.</p>
                  {form.joinRegistry && <p className="text-xs text-gold/50 mt-3">You&apos;ve also been added to the CDCC constituency registry.</p>}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </section>
        )}

        {/* POST-EVENT: Recording */}
        {isPast && event.recording_url && (
          <section className="py-16 px-6 bg-charcoal text-white pattern-overlay-dark relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            <div className="max-w-4xl mx-auto relative z-10 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-4">Recording</p>
              <h2 className="font-display text-2xl font-bold text-white mb-6">Watch the full event</h2>
              <a href={event.recording_url} target="_blank" rel="noopener" className="btn-gold text-xs tracking-[0.15em] uppercase px-10 py-4 inline-block">Watch on YouTube &rarr;</a>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          </section>
        )}

        {/* POST-EVENT: Feedback */}
        {isPast && event.feedback_enabled && (
          <section className="py-16 px-6 bg-paper texture-paper">
            <div className="max-w-xl mx-auto relative z-10">
              {!fbSubmitted ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Feedback</p>
                  <h2 className="font-display text-xl font-bold text-black mb-6 text-center">How was the event?</h2>
                  <form onSubmit={handleFeedback} className="space-y-3">
                    <input value={fbForm.name} onChange={e => setFbForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name (optional)" className="w-full border border-gray-200/60 px-4 py-3 text-sm rounded focus:outline-none focus:border-black" />
                    <div><p className="text-xs text-gray-500 mb-2">Rating</p><div className="flex gap-2">{[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setFbForm(f => ({ ...f, rating: s }))} className={`text-2xl transition-colors ${s <= fbForm.rating ? 'text-gold' : 'text-gray-200 hover:text-gold/50'}`}>★</button>)}</div></div>
                    <textarea value={fbForm.highlights} onChange={e => setFbForm(f => ({ ...f, highlights: e.target.value }))} placeholder="What were the highlights?" rows={3} className="w-full border border-gray-200/60 px-4 py-3 text-sm rounded focus:outline-none focus:border-black resize-y" />
                    <textarea value={fbForm.improvements} onChange={e => setFbForm(f => ({ ...f, improvements: e.target.value }))} placeholder="What could be improved?" rows={3} className="w-full border border-gray-200/60 px-4 py-3 text-sm rounded focus:outline-none focus:border-black resize-y" />
                    <button type="submit" className="w-full btn-ink text-xs tracking-[0.15em] uppercase py-3">Submit Feedback</button>
                  </form>
                </>
              ) : <div className="text-center py-8"><p className="font-display text-lg font-bold text-black">Thank you for your feedback.</p></div>}
            </div>
          </section>
        )}

        {/* CONTEXT LINKS */}
        <section className="py-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8">
            <Link href="/events" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">&larr; All events</Link>
            <Link href="/join" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Join the CDCC Council &rarr;</Link>
            <Link href="/the-plan" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">See the strategic plan &rarr;</Link>
          </div>
        </section>
      </div>
    );
  }

  // ── SIMPLE EVENT PAGE (non-dedicated) ──
  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/events" className="text-xs text-gray-500 hover:text-black transition-colors">&larr; All Events</Link>
        <div className="flex items-center gap-3 mt-6 mb-2">
          {event.event_type && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gold/20 text-gold/60 rounded">{event.event_type}</span>}
          {event.format && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 text-gray-500 rounded">{event.format}</span>}
        </div>
        <p className="text-xs text-black font-medium mb-2">{new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.event_time ? ` at ${event.event_time.slice(0, 5)}` : ''}</p>
        <h1 className="font-display text-3xl font-bold text-black tracking-tight mb-4">{event.title}</h1>
        {event.venue && <p className="text-sm text-gray-500 mb-2">{event.venue}{event.venue_address ? `, ${event.venue_address}` : ''}</p>}
        {spotsLeft !== null && !isPast && <p className="text-xs text-gray-500/70 mb-6">{spotsLeft} of {event.capacity} spots remaining</p>}
        {event.description && <div className="text-sm text-black/70 leading-relaxed mb-12 whitespace-pre-wrap">{event.description}</div>}

        {isPast && event.recording_url && (
          <div className="border border-gold/20 bg-gold/5 rounded p-6 mb-8 text-center">
            <p className="text-sm font-medium text-black mb-2">Event recording available</p>
            <a href={event.recording_url} target="_blank" rel="noopener" className="btn-gold text-xs tracking-[0.15em] uppercase px-6 py-2 inline-block">Watch Recording &rarr;</a>
          </div>
        )}

        {!isPast && event.registration_required !== false && !registered && (
          <div className="border border-gray-200/50 rounded p-8 bg-white">
            <h2 className="font-display text-lg font-bold text-black mb-4">Register for this event</h2>
            <form onSubmit={handleRegister} className="space-y-3 max-w-md">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" required className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
              <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={form.joinRegistry} onChange={e => setForm(f => ({ ...f, joinRegistry: e.target.checked }))} className="w-4 h-4 mt-0.5" /><div><p className="text-sm text-black">Also join the CDCC Council</p><p className="text-xs text-gray-500">Get represented in national policy</p></div></label>
              <button type="submit" disabled={submitting} className="w-full bg-black text-white text-xs font-medium tracking-[0.15em] uppercase py-3 rounded disabled:opacity-50">{submitting ? 'Registering...' : 'Register'}</button>
            </form>
          </div>
        )}

        {registered && (
          <div className="border border-green-600/30 bg-green-600/5 rounded p-8 text-center">
            <p className="font-display text-lg font-bold text-black mb-2">You&apos;re registered!</p>
            <p className="text-sm text-gray-500">Confirmation sent to {form.email}.</p>
            {form.joinRegistry && <p className="text-xs text-gold mt-2">You&apos;ve also been added to the CDCC registry.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
