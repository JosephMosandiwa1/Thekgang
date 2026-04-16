'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TicketQR, WhatsAppShareButton } from '@/components/EventFeatures';

/**
 * DedicatedEventPage — the books-cluster mini-site for a single event.
 *
 * Thekgang identity: charcoal + gold + cream/paper textures, Hoves font,
 * literary warmth. NOT a copy of ANFASA — custom to the books cluster.
 *
 * Sections: Hero → About → Programme (accordion) → Speakers (B&W grid) →
 * Documents → Tickets + Registration → Partners (gold band) →
 * Post-event (recording + feedback) → Footer links
 */

interface EventFull {
  id: number; title: string; slug: string; tagline: string; event_type: string; format: string;
  event_date: string; event_time: string; end_date: string; venue: string; venue_address: string;
  capacity: number; status: string; description: string; cover_image_url: string;
  programme_schedule: any[]; speakers: any[]; sponsors: any[]; recording_url: string;
  gallery_urls: string[]; feedback_enabled: boolean; registration_required: boolean;
  is_dedicated: boolean; documents: any[]; virtual_link: string; reading_list: any[];
}

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape'];
const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'programme', label: 'Programme' },
  { id: 'speakers', label: 'Speakers' },
  { id: 'partners', label: 'Partners' },
];

export default function DedicatedEventPage({ event, regCount }: { event: EventFull; regCount: number }) {
  const [activeSection, setActiveSection] = useState('about');
  const [expandedSession, setExpandedSession] = useState<number | null>(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', organisation: '', province: '', constituency_type: '', joinRegistry: false, ticket_type_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [fbForm, setFbForm] = useState({ name: '', rating: 5, highlights: '', improvements: '', would_recommend: true });
  const [fbSubmitted, setFbSubmitted] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const navRef = useRef<HTMLElement>(null);

  const isPast = event.event_date < new Date().toISOString().split('T')[0];
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - regCount) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const schedule = Array.isArray(event.programme_schedule) ? event.programme_schedule : [];
  const eventSpeakers = Array.isArray(event.speakers) ? event.speakers : [];
  const eventSponsors = Array.isArray(event.sponsors) ? event.sponsors : [];
  const docs = Array.isArray(event.documents) ? event.documents : [];
  const partners = eventSponsors.filter((s: any) => s.type === 'partner');
  const sponsorList = eventSponsors.filter((s: any) => s.type === 'sponsor');
  const supporters = eventSponsors.filter((s: any) => s.type === 'supporter');
  const mediaPartners = eventSponsors.filter((s: any) => s.type === 'media_partner');

  useEffect(() => {
    if (!supabase) return;
    supabase.from('event_ticket_types').select('*').eq('event_id', event.id).eq('is_active', true).order('sort_order').then(({ data }) => setTickets(data || []));
  }, [event.id]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      }
    }, { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 });
    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !form.name || !form.email) return;
    setSubmitting(true);
    const ticketCode = `CDCC-${event.slug || event.id}-${Date.now().toString(36).toUpperCase()}`;
    const isWaitlisted = isFull;
    await supabase.from('event_registrations').insert({
      event_id: event.id, name: form.name, email: form.email, phone: form.phone || null,
      organisation: form.organisation || null, province: form.province || null,
      qr_code: ticketCode, waitlisted: isWaitlisted,
      ticket_type_id: form.ticket_type_id || null,
      ticket_code: ticketCode,
    });
    if (form.joinRegistry) {
      await supabase.from('constituency_submissions').insert({
        name: form.name, email: form.email, phone: form.phone || null,
        province: form.province || null, organisation: form.organisation || null,
        constituency_type: form.constituency_type || 'other', status: 'new',
        utm_source: 'event_registration', utm_campaign: event.slug || String(event.id),
      });
    }
    setSubmitting(false);
    setRegistered(true);
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    await supabase.from('event_feedback').insert({
      event_id: event.id, name: fbForm.name || null, rating: fbForm.rating,
      highlights: fbForm.highlights || null, improvements: fbForm.improvements || null,
      would_recommend: fbForm.would_recommend,
    });
    setFbSubmitted(true);
  }

  return (
    <div className="bg-white text-charcoal">
      {/* ── STICKY NAV ── */}
      <nav ref={navRef} className="sticky top-0 z-50 bg-charcoal/95 backdrop-blur border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-12">
          <Link href="/events" className="flex items-center gap-2">
            <img src="/logos/icon-char-gld.svg" alt="CDCC" className="w-5 h-5 invert" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 hidden sm:inline">CDCC</span>
          </Link>
          <div className="flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${activeSection === item.id ? 'text-gold' : 'text-white/50 hover:text-white'}`}>
                {item.label}
              </button>
            ))}
            {!isPast && event.registration_required && (
              <button onClick={() => scrollTo('register')} className="text-[10px] uppercase tracking-[0.15em] bg-gold text-charcoal px-4 py-1.5 rounded font-semibold hover:bg-gold/90 transition-colors">
                {isFull ? 'Waitlist' : 'Register'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[65vh] flex flex-col justify-end px-6 pb-16 bg-charcoal overflow-hidden">
        {event.cover_image_url ? (
          <div className="absolute inset-0">
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/30" />
          </div>
        ) : (
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url(/logos/patt-01-wht.svg)', backgroundRepeat: 'repeat', backgroundSize: '200px' }} />
        )}
        <div className="relative z-10 max-w-5xl mx-auto w-full pt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] uppercase tracking-wider px-2.5 py-1 border border-gold/30 text-gold/70 rounded">{event.event_type || 'event'}</span>
            <span className="text-[9px] uppercase tracking-wider px-2.5 py-1 border border-white/15 text-white/40 rounded">{event.format || 'in-person'}</span>
          </div>
          <h1 className="font-display font-bold text-white tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>{event.title}</h1>
          {event.tagline && <p className="text-lg text-white/45 mt-4 max-w-2xl font-display italic">{event.tagline}</p>}
          <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg>
              {new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {event.event_time && <span>{event.event_time.slice(0, 5)}</span>}
            {event.venue && <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" /></svg>{event.venue}</span>}
          </div>
          <div className="mt-8 flex gap-4">
            {isPast && event.recording_url ? (
              <a href={event.recording_url} target="_blank" rel="noopener" className="bg-gold text-charcoal text-xs tracking-[0.15em] uppercase font-semibold px-8 py-3.5 rounded hover:bg-gold/90 transition-colors inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
                Watch Recording
              </a>
            ) : !isPast && event.registration_required ? (
              <button onClick={() => scrollTo('register')} className="bg-gold text-charcoal text-xs tracking-[0.15em] uppercase font-semibold px-8 py-3.5 rounded hover:bg-gold/90 transition-colors">
                {isFull ? 'Join Waitlist' : 'Register Now'}
              </button>
            ) : null}
            <a href={`/api/events/${event.id}/calendar`} className="border border-white/20 text-white/60 text-xs tracking-[0.15em] uppercase px-6 py-3.5 rounded hover:border-white/40 hover:text-white transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
              Add to Calendar
            </a>
            <WhatsAppShareButton eventTitle={event.title} eventDate={event.event_date} eventUrl={typeof window !== 'undefined' ? window.location.href : ''} venue={event.venue} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent z-10" />
      </section>

      {/* ── ABOUT ── */}
      {event.description && (
        <section id="about" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">About This Event</p>
            <h2 className="font-display text-3xl font-bold text-charcoal tracking-tight mb-8">About the {event.event_type || 'Event'}</h2>
            <div className="text-sm text-charcoal/70 leading-[1.8] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: event.description }} />
          </div>
        </section>
      )}

      {/* ── PROGRAMME (accordion) ── */}
      {schedule.length > 0 && (
        <section id="programme" className="py-20 px-6 bg-[#f5f3ef]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Programme</p>
            <h2 className="font-display text-3xl font-bold text-charcoal tracking-tight mb-4 text-center">Programme Details</h2>
            <p className="text-center text-lg text-charcoal/60 mb-2 font-display">
              {new Date(event.event_date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {event.event_time && <p className="text-center text-sm text-gold/60 mb-12 font-mono">{event.event_time.slice(0, 5)}{event.end_date ? ` – ${event.end_date}` : ''}</p>}

            <div className="space-y-2">
              {schedule.map((item: any, i: number) => {
                const isOpen = expandedSession === i;
                const isBreak = item.type === 'break';
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedSession(isOpen ? null : i)}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded text-left transition-colors ${isBreak ? 'bg-charcoal/5 text-charcoal/50' : 'bg-charcoal text-white hover:bg-charcoal/90'}`}
                    >
                      {!isBreak && <span className="text-gold text-lg">🎙</span>}
                      <span className="flex-1 text-sm uppercase tracking-[0.1em] font-semibold">{item.title}</span>
                      <span className="text-xs opacity-50">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && !isBreak && (
                      <div className="px-6 py-6 bg-white border-x border-b border-gray-200/60 rounded-b">
                        {item.description && <p className="text-sm text-charcoal/50 italic mb-4 font-display">{item.description}</p>}
                        {item.time && <p className="text-xs text-gold/60 font-mono mb-3">{item.time}</p>}
                        {item.facilitator && <p className="text-sm mb-3"><span className="font-semibold text-charcoal/60">Facilitator:</span> <span className="text-gold">{item.facilitator}</span></p>}
                        {item.speakers && (
                          <div>
                            <p className="font-semibold text-xs uppercase tracking-wider text-charcoal/50 mb-2">Speakers</p>
                            <div className="flex flex-col gap-1">
                              {item.speakers.split(',').map((name: string, si: number) => {
                                const trimmed = name.trim();
                                const speakerIdx = eventSpeakers.findIndex((sp: any) => sp.name?.trim() === trimmed);
                                return (
                                  <span key={si} className="text-sm">
                                    {speakerIdx >= 0 ? (
                                      <Link href={`/events/${event.slug || event.id}/speakers/${speakerIdx}`} className="text-gold hover:text-gold/80 font-medium transition-colors">
                                        {trimmed}
                                      </Link>
                                    ) : (
                                      <span className="text-charcoal/70">{trimmed}</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {item.notes && <p className="text-xs text-charcoal/40 mt-4 italic">{item.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-charcoal/30 mt-6 text-center italic">This programme is subject to change without prior notice.</p>

            {docs.some((d: any) => d.type === 'programme') && (
              <div className="mt-6 text-center">
                {docs.filter((d: any) => d.type === 'programme').map((d: any, i: number) => (
                  <a key={i} href={d.url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-charcoal/10 text-charcoal text-xs tracking-[0.1em] uppercase px-6 py-3 rounded hover:bg-charcoal/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Download Programme
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SPEAKERS ── */}
      {eventSpeakers.length > 0 && (
        <section id="speakers" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Speakers</p>
            <h2 className="font-display text-3xl font-bold text-charcoal tracking-tight mb-12 text-center">Speakers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventSpeakers.map((sp: any, i: number) => (
                <Link key={i} href={`/events/${event.slug || event.id}/speakers/${i}`} className="group block text-center">
                  {sp.photo_url ? (
                    <img src={sp.photo_url} alt={sp.name} className="w-36 h-36 rounded-full object-cover mx-auto mb-4 grayscale group-hover:grayscale-0 transition-all duration-500 border-2 border-transparent group-hover:border-gold/30" />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-charcoal/5 mx-auto mb-4 flex items-center justify-center text-2xl font-display text-charcoal/20">{(sp.name || '?')[0]}</div>
                  )}
                  <h3 className="font-display text-base font-bold text-charcoal group-hover:text-gold transition-colors">{sp.name}</h3>
                  <p className="text-[11px] text-charcoal/50 mt-1 uppercase tracking-wider">{sp.session || sp.type || ''}</p>
                  <p className="text-xs text-charcoal/40 mt-1">{sp.title}{sp.organisation ? ` — ${sp.organisation}` : ''}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DOCUMENTS ── */}
      {docs.length > 0 && (
        <section className="py-12 px-6 bg-[#f5f3ef]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Documents</p>
            <div className="flex flex-wrap gap-3">
              {docs.map((d: any, i: number) => (
                <a key={i} href={d.url} target="_blank" rel="noopener" className="flex items-center gap-3 border border-charcoal/10 rounded px-5 py-3 bg-white hover:border-gold/30 transition-colors">
                  <svg className="w-5 h-5 text-gold/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <span className="text-sm text-charcoal">{d.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {Array.isArray(event.gallery_urls) && event.gallery_urls.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Gallery</p>
            <h2 className="font-display text-2xl font-bold text-charcoal tracking-tight mb-8 text-center">Event Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {event.gallery_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener" className="aspect-square rounded overflow-hidden group">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── READING LIST ── */}
      {Array.isArray(event.reading_list) && event.reading_list.length > 0 && (
        <section className="py-16 px-6 bg-[#f5f3ef]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Recommended Reading</p>
            <h2 className="font-display text-2xl font-bold text-charcoal tracking-tight mb-8 text-center">Reading List</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.reading_list.map((book: any, i: number) => (
                <div key={i} className="flex gap-4 bg-white rounded p-4 border border-charcoal/5">
                  {book.cover_url && <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded flex-shrink-0" />}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal">{book.title}</h3>
                    {book.author && <p className="text-xs text-charcoal/50 mt-0.5">{book.author}</p>}
                    {book.description && <p className="text-xs text-charcoal/40 mt-2 line-clamp-2">{book.description}</p>}
                    {book.link && <a href={book.link} target="_blank" rel="noopener" className="text-[10px] text-gold hover:text-gold/80 uppercase tracking-wider mt-2 inline-block">View →</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TICKETS + REGISTRATION ── */}
      {!isPast && event.registration_required && (
        <section id="register" className="py-20 px-6 bg-charcoal text-white relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url(/logos/patt-01-wht.svg)', backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
          <div className="max-w-xl mx-auto relative z-10">
            {!registered ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-4 text-center">{isFull ? 'Waitlist' : 'Register'}</p>
                <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-2 text-center">{isFull ? 'Event full — join the waitlist' : 'Secure your spot'}</h2>
                {spotsLeft !== null && !isFull && <p className="text-center text-sm text-white/30 mb-8">{spotsLeft} of {event.capacity} spots remaining</p>}

                {tickets.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Select ticket</p>
                    {tickets.map((t: any) => {
                      const soldOut = t.quantity != null && t.sold >= t.quantity;
                      return (
                        <label key={t.id} className={`flex items-center gap-4 p-4 rounded border cursor-pointer transition-colors ${form.ticket_type_id === t.id ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/20'} ${soldOut ? 'opacity-40 pointer-events-none' : ''}`}>
                          <input type="radio" name="ticket" value={t.id} checked={form.ticket_type_id === t.id} onChange={() => setForm(f => ({ ...f, ticket_type_id: t.id }))} className="accent-gold" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{t.name} {soldOut && '(Sold out)'}</p>
                            {t.description && <p className="text-xs text-white/40">{t.description}</p>}
                          </div>
                          <span className="text-sm font-mono text-gold">{t.price_zar > 0 ? `R${t.price_zar}` : 'Free'}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" required className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 rounded focus:outline-none focus:border-gold" />
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email *" required className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 rounded focus:outline-none focus:border-gold" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 rounded focus:outline-none focus:border-gold" />
                    <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} className="bg-white/5 border border-white/10 px-4 py-3 text-sm text-white rounded focus:outline-none focus:border-gold">
                      <option value="">Province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} placeholder="Organisation" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 rounded focus:outline-none focus:border-gold" />
                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input type="checkbox" checked={form.joinRegistry} onChange={e => setForm(f => ({ ...f, joinRegistry: e.target.checked }))} className="w-4 h-4 mt-0.5 accent-gold" />
                    <div><p className="text-sm text-white/80">Also join the CDCC Council</p><p className="text-xs text-white/30">Get represented in national advocacy and policy</p></div>
                  </label>
                  <button type="submit" disabled={submitting} className="w-full bg-gold text-charcoal text-xs tracking-[0.15em] uppercase font-semibold py-4 mt-2 rounded hover:bg-gold/90 disabled:opacity-50 transition-colors">
                    {submitting ? 'Registering…' : isFull ? 'Join Waitlist' : 'Register'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">You&apos;re {isFull ? 'on the waitlist' : 'registered'}!</h2>
                <p className="text-sm text-white/40 mb-4">Confirmation sent to {form.email}.</p>
                <div className="mb-6">
                  <TicketQR code={`CDCC-${event.slug || event.id}-${Date.now().toString(36).toUpperCase()}`} eventTitle={event.title} />
                </div>
                <a href={`/api/events/${event.id}/calendar`} className="inline-flex items-center gap-2 border border-white/20 text-white/60 text-xs tracking-[0.1em] uppercase px-5 py-2 rounded hover:border-white/40 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" /></svg>
                  Add to Calendar
                </a>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </section>
      )}

      {/* ── PARTNERS (gold band) ── */}
      {eventSponsors.length > 0 && (
        <section id="partners" className="py-16 px-6 bg-gold">
          <div className="max-w-5xl mx-auto text-center">
            <img src="/logos/icon-char-gld.svg" alt="CDCC" className="w-10 h-10 mx-auto mb-6 opacity-30" />
            {partners.length > 0 && (
              <div className="mb-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/40 mb-6">Partners</p>
                <div className="flex flex-wrap justify-center gap-8 items-center">
                  {partners.map((s: any, i: number) => s.logo_url ? (
                    <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="block bg-white rounded-lg px-6 py-4 hover:shadow-md transition-shadow">
                      <img src={s.logo_url} alt={s.name} className="h-12 object-contain" />
                    </a>
                  ) : (
                    <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="text-lg font-display font-bold text-charcoal hover:text-charcoal/70 transition-colors">{s.name}</a>
                  ))}
                </div>
              </div>
            )}
            {sponsorList.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/40 mb-4">Sponsors</p>
                <div className="flex flex-wrap justify-center gap-6 items-center">{sponsorList.map((s: any, i: number) => s.logo_url ? <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="bg-white rounded px-4 py-3 hover:shadow-sm transition-shadow"><img src={s.logo_url} alt={s.name} className="h-8 object-contain" /></a> : <a key={i} href={s.website || '#'} target="_blank" rel="noopener" className="text-sm font-medium text-charcoal hover:text-charcoal/70">{s.name}</a>)}</div>
              </div>
            )}
            {supporters.length > 0 && <div className="mb-4"><p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/40 mb-3">Supporters</p><div className="flex flex-wrap justify-center gap-4">{supporters.map((s: any, i: number) => <span key={i} className="text-xs text-charcoal/60">{s.name}</span>)}</div></div>}
            {mediaPartners.length > 0 && <div><p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/40 mb-3">Media Partners</p><div className="flex flex-wrap justify-center gap-4">{mediaPartners.map((s: any, i: number) => <span key={i} className="text-xs text-charcoal/60">{s.name}</span>)}</div></div>}
          </div>
        </section>
      )}

      {/* ── POST-EVENT: Recording ── */}
      {isPast && event.recording_url && (
        <section className="py-20 px-6 bg-charcoal text-white relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-4">Recording</p>
            <h2 className="font-display text-2xl font-bold text-white mb-8">Watch the full event</h2>
            {event.recording_url.includes('youtube.com') || event.recording_url.includes('youtu.be') ? (
              <div className="aspect-video w-full max-w-3xl mx-auto rounded-lg overflow-hidden border border-white/10">
                <iframe
                  src={event.recording_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a href={event.recording_url} target="_blank" rel="noopener" className="bg-gold text-charcoal text-xs tracking-[0.15em] uppercase font-semibold px-10 py-4 rounded hover:bg-gold/90 transition-colors inline-block">Watch Recording →</a>
            )}
          </div>
        </section>
      )}

      {/* ── POST-EVENT: Feedback ── */}
      {isPast && event.feedback_enabled && (
        <section className="py-16 px-6 bg-[#f5f3ef]">
          <div className="max-w-xl mx-auto">
            {!fbSubmitted ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4 text-center">Feedback</p>
                <h2 className="font-display text-xl font-bold text-charcoal mb-8 text-center">How was the event?</h2>
                <form onSubmit={handleFeedback} className="space-y-3">
                  <input value={fbForm.name} onChange={e => setFbForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name (optional)" className="w-full border border-charcoal/10 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold bg-white" />
                  <div><p className="text-xs text-charcoal/50 mb-2">Rating</p><div className="flex gap-2">{[1,2,3,4,5].map(s => <button key={s} type="button" onClick={() => setFbForm(f => ({ ...f, rating: s }))} className={`text-2xl transition-colors ${s <= fbForm.rating ? 'text-gold' : 'text-gray-200 hover:text-gold/50'}`}>★</button>)}</div></div>
                  <textarea value={fbForm.highlights} onChange={e => setFbForm(f => ({ ...f, highlights: e.target.value }))} placeholder="What were the highlights?" rows={3} className="w-full border border-charcoal/10 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold resize-y bg-white" />
                  <textarea value={fbForm.improvements} onChange={e => setFbForm(f => ({ ...f, improvements: e.target.value }))} placeholder="What could be improved?" rows={3} className="w-full border border-charcoal/10 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold resize-y bg-white" />
                  <button type="submit" className="w-full bg-charcoal text-white text-xs font-semibold tracking-[0.15em] uppercase py-3 rounded hover:bg-charcoal/90 transition-colors">Submit Feedback</button>
                </form>
              </>
            ) : <div className="text-center py-8"><p className="font-display text-lg font-bold text-charcoal">Thank you for your feedback.</p></div>}
          </div>
        </section>
      )}

      {/* ── FOOTER LINKS ── */}
      <section className="py-12 px-6 border-t border-charcoal/5">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8">
          <Link href="/events" className="text-xs text-charcoal/40 hover:text-charcoal transition-colors tracking-wider uppercase">← All events</Link>
          <Link href="/join" className="text-xs text-charcoal/40 hover:text-charcoal transition-colors tracking-wider uppercase">Join the CDCC Council →</Link>
          <Link href="/the-plan" className="text-xs text-charcoal/40 hover:text-charcoal transition-colors tracking-wider uppercase">See the strategic plan →</Link>
        </div>
      </section>
    </div>
  );
}
