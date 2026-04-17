'use client';

import { useState } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function NominationFormSection({ event }: SectionProps) {
  const categories: any[] = Array.isArray(event.award_categories) ? event.award_categories : [];
  const [form, setForm] = useState({ category: '', nominee_name: '', work_title: '', motivation: '', nominator_email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.nominee_name || !form.motivation) { setError('Please fill in all required fields.'); return; }
    setSubmitting(true); setError('');
    const { error: err } = await supabase!.from('event_nominations').insert({
      event_id: event.id, category: form.category, nominee_name: form.nominee_name,
      work_title: form.work_title, motivation: form.motivation, nominator_email: form.nominator_email,
    });
    setSubmitting(false);
    if (err) { setError('Submission failed. Please try again.'); return; }
    setDone(true);
  }

  return (
    <section id="nomination_form" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Nominate</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Submit a Nomination</h2>

        {done ? (
          <div className="text-center py-12">
            <p className="font-display text-2xl text-black mb-2">Nomination received.</p>
            <p className="text-sm text-black/50">Thank you for your submission.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none">
              <option value="">Select category *</option>
              {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="Nominee name *" value={form.nominee_name} onChange={e => setForm(f => ({ ...f, nominee_name: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none" />
            <input type="text" placeholder="Work title" value={form.work_title} onChange={e => setForm(f => ({ ...f, work_title: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none" />
            <textarea placeholder="Motivation *" value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} rows={4} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none resize-none" />
            <input type="email" placeholder="Your email" value={form.nominator_email} onChange={e => setForm(f => ({ ...f, nominator_email: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3.5 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Nomination'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
