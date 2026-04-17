'use client';

import { useState, useRef } from 'react';
import type { SectionProps } from '../SectionRegistry';
import { supabase } from '@/lib/supabase/client';

export default function ApplicationFormSection({ event }: SectionProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', organisation: '', motivation: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.motivation) { setError('Please complete all required fields.'); return; }
    setSubmitting(true); setError('');

    let cv_url = '';
    if (cvFile && supabase) {
      const path = `applications/${event.id}/${Date.now()}-${cvFile.name}`;
      const { error: upErr } = await supabase!.storage.from('event-files').upload(path, cvFile);
      if (!upErr) {
        const { data } = supabase.storage.from('event-files').getPublicUrl(path);
        cv_url = data.publicUrl;
      }
    }

    const { error: err } = await supabase!.from('event_registrations').insert({
      event_id: event.id, name: form.name, email: form.email, phone: form.phone,
      organisation: form.organisation, status: 'pending',
      custom_fields: { motivation: form.motivation, cv_url },
    });
    setSubmitting(false);
    if (err) { setError('Submission failed. Please try again.'); return; }
    setDone(true);
  }

  if (event._isPast) return null;

  return (
    <section id="application_form" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Apply</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Apply to Attend</h2>

        {done ? (
          <div className="text-center py-12">
            <p className="font-display text-2xl text-black mb-2">Application submitted.</p>
            <p className="text-sm text-black/50">We will be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="text" placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none bg-white" />
            <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none bg-white" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none bg-white" />
            <input type="text" placeholder="Organisation" value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none bg-white" />
            <textarea placeholder="Motivation *" value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} rows={4} className="w-full border border-gray-200 rounded px-4 py-3 text-sm focus:border-black/30 focus:outline-none resize-none bg-white" />
            <div>
              <label className="text-sm text-black/60 block mb-2">Upload CV (optional)</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} className="text-sm text-black/60" />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3.5 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
