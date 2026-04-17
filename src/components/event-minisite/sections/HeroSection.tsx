'use client';

import type { SectionProps } from '../SectionRegistry';

export default function HeroSection({ event }: SectionProps) {
  const isPast = event._isPast;
  const spotsLeft = event.capacity ? Math.max(0, event.capacity - (event._regCount || 0)) : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-end px-6 pb-20 bg-black overflow-hidden">
      {event.cover_image_url && (
        <div className="absolute inset-0">
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          {event.event_type && <span className="text-[9px] uppercase tracking-[0.2em] px-3 py-1 border border-white/20 text-white/50 rounded">{event.event_type.replace('_', ' ')}</span>}
          {event.format && <span className="text-[9px] uppercase tracking-[0.2em] px-3 py-1 border border-white/10 text-white/30 rounded">{event.format}</span>}
        </div>

        <h1 className="font-display font-bold text-white tracking-tight leading-[1.0]" style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}>
          {event.title}
        </h1>

        {event.tagline && (
          <p className="font-display italic text-white/40 mt-4 max-w-2xl" style={{ fontSize: 'clamp(16px, 2.5vw, 24px)' }}>
            {event.tagline}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-white/50">
          <span className="flex items-center gap-2">
            <DateBlock date={event.event_date} />
          </span>
          {event.event_time && <span className="font-mono text-white/40">{event.event_time.slice(0, 5)}</span>}
          {event.venue && <span>{event.venue}</span>}
          {spotsLeft !== null && !isPast && (
            <span className={spotsLeft <= 10 ? 'text-red-400' : ''}>{spotsLeft} spots remaining</span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-8">
          {isPast && event.recording_url ? (
            <a href={event.recording_url} target="_blank" rel="noopener" className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-3.5">
              Watch Recording
            </a>
          ) : !isPast && (event.registration_required || event.registration_required === undefined) ? (
            <button onClick={() => scrollTo('registration')} className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-3.5">
              {isFull ? 'Join Waitlist' : 'Register Now'}
            </button>
          ) : null}
          <a href={`/api/events/${event.id}/calendar`} className="btn-ink-white text-xs tracking-[0.15em] uppercase px-6 py-3.5 opacity-60 hover:opacity-100">
            Add to Calendar
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
    </section>
  );
}

function DateBlock({ date }: { date: string }) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-ZA', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const weekday = d.toLocaleDateString('en-ZA', { weekday: 'long' });

  return (
    <div className="flex items-center gap-3">
      <div className="text-center border border-white/20 rounded px-3 py-2">
        <div className="text-2xl font-bold text-white leading-none">{day}</div>
        <div className="text-[9px] text-white/50 tracking-wider">{month}</div>
      </div>
      <div>
        <div className="text-sm text-white/70">{weekday}</div>
        <div className="text-xs text-white/40">{year}</div>
      </div>
    </div>
  );
}
