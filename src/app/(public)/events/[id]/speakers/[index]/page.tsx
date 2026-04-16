'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function SpeakerDetailPage({ params }: { params: { id: string; index: string } }) {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const idx = parseInt(params.index);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const isNumeric = /^\d+$/.test(params.id);
    (async () => {
      let data: any = null;
      if (!isNumeric) { const res = await supabase.from('events').select('*').eq('slug', params.id).single(); data = res.data; }
      if (!data) { const res = await supabase.from('events').select('*').eq('id', parseInt(params.id) || 0).single(); data = res.data; }
      setEvent(data);
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <div className="pt-32 pb-20 px-6 text-center text-gray-400">Loading…</div>;

  const speakers = Array.isArray(event?.speakers) ? event.speakers : [];
  const speaker = speakers[idx];
  if (!event || !speaker) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500">Speaker not found.</p><Link href={`/events/${params.id}`} className="text-xs text-charcoal mt-4 inline-block">← Back to event</Link></div>;

  const eventLink = `/events/${event.slug || event.id}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <Link href={`${eventLink}#speakers`} className="text-xs text-charcoal/40 hover:text-charcoal transition-colors tracking-wider uppercase">
          ← {event.title} · Speakers
        </Link>

        <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
          {speaker.photo_url ? (
            <img src={speaker.photo_url} alt={speaker.name} className="w-48 h-48 rounded-lg object-cover flex-shrink-0 border border-charcoal/5" />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-charcoal/5 flex items-center justify-center text-4xl font-display text-charcoal/15 flex-shrink-0">{(speaker.name || '?')[0]}</div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gold/20 text-gold/60 rounded">{speaker.type || 'speaker'}</span>
              {speaker.session && <span className="text-[9px] uppercase tracking-wider text-charcoal/40">{speaker.session}</span>}
            </div>
            <h1 className="font-display text-3xl font-bold text-charcoal tracking-tight">{speaker.name}</h1>
            <p className="text-sm text-charcoal/50 mt-1">{speaker.title}{speaker.organisation ? ` — ${speaker.organisation}` : ''}</p>
            {speaker.website && (
              <a href={speaker.website} target="_blank" rel="noopener" className="inline-block mt-3 text-xs text-gold hover:text-gold/80 transition-colors tracking-wider uppercase">
                Website →
              </a>
            )}
          </div>
        </div>

        {speaker.bio && (
          <div className="mt-10 prose prose-sm max-w-none text-charcoal/70 leading-[1.8]">
            <p className="whitespace-pre-wrap">{speaker.bio}</p>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-charcoal/5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/30 mb-4">Speaking at</p>
          <Link href={eventLink} className="flex items-center gap-3 p-4 rounded border border-charcoal/10 hover:border-gold/30 transition-colors">
            <div className="w-12 h-12 bg-charcoal/5 rounded flex items-center justify-center text-xs font-mono text-charcoal/30">
              {new Date(event.event_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">{event.title}</p>
              <p className="text-xs text-charcoal/40">{event.venue || event.format} · {new Date(event.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </Link>
        </div>

        {speakers.length > 1 && (
          <div className="mt-12 pt-6 border-t border-charcoal/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/30 mb-4">Other speakers at this event</p>
            <div className="flex flex-wrap gap-4">
              {speakers.filter((_: any, i: number) => i !== idx).slice(0, 6).map((sp: any, i: number) => {
                const realIdx = speakers.indexOf(sp);
                return (
                  <Link key={i} href={`${eventLink}/speakers/${realIdx}`} className="flex items-center gap-3 group">
                    {sp.photo_url ? (
                      <img src={sp.photo_url} alt={sp.name} className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-charcoal/5 flex items-center justify-center text-xs text-charcoal/20">{(sp.name || '?')[0]}</div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-charcoal group-hover:text-gold transition-colors">{sp.name}</p>
                      <p className="text-[10px] text-charcoal/40">{sp.type}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
