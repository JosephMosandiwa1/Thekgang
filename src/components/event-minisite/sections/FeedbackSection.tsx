'use client';

import { useState } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function FeedbackSection({ event }: SectionProps) {
  const [rating, setRating] = useState(0);
  const [highlights, setHighlights] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!event._isPast || !event.feedback_enabled) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await supabase!.from('event_feedback').insert({
      event_id: event.id, rating, highlights, improvements,
    });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <section id="feedback" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Feedback</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Share Your Feedback</h2>

        {done ? (
          <div className="text-center py-12">
            <p className="font-display text-2xl text-black mb-2">Thank you.</p>
            <p className="text-sm text-black/50">Your feedback helps us improve future events.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-sm text-black/60 mb-3">How would you rate this event?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    className={`text-3xl transition-colors ${star <= rating ? 'text-black' : 'text-black/15 hover:text-black/30'}`}>
                    &#9733;
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-black/60 block mb-1">What were the highlights?</label>
              <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={3} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-sm text-black/60 block mb-1">What could be improved?</label>
              <textarea value={improvements} onChange={e => setImprovements(e.target.value)} rows={3} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={submitting || rating === 0} className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3.5 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
