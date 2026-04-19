'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { isEmail } from '@/lib/utils';

const INTERESTS = ['events', 'fundraising', 'communications', 'community_outreach', 'research', 'sector_survey', 'mentorship', 'translation', 'editorial'];

export default function VolunteerPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', interests: [] as string[], skills: '', availability: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(v: string) {
    setForm((f) => ({ ...f, interests: f.interests.includes(v) ? f.interests.filter((x) => x !== v) : [...f.interests, v] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(form.email)) { setError('Enter a valid email'); return; }
    setSaving(true); setError(null);
    if (!supabase) { setError('DB unavailable'); setSaving(false); return; }
    const { error: err } = await supabase.from('volunteers').insert({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      interests: form.interests,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      availability: form.availability || null,
      status: 'active',
    });
    if (err) setError(err.message);
    else setSubmitted(true);
    setSaving(false);
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Volunteer</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>Help us run the Council.</h1>
        <p className="text-gray-600 mt-6 mb-8 text-sm">
          We run on volunteer energy — from events to research, community outreach, and sector advocacy. Tell us what you can bring.
        </p>

        {submitted ? (
          <div className="border border-green-300 bg-green-50 p-6 text-sm text-green-800">
            Thank you — we&apos;ve got your details. A member of the volunteer team will be in touch within a week. <Link href="/" className="underline">Back to the Council →</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Full name *</span><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email *</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" /></label>
            </div>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" /></label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Interests</span>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button key={i} type="button" onClick={() => toggle(i)} className={`px-3 py-1.5 text-xs border ${form.interests.includes(i) ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600'}`}>{i.replace(/_/g, ' ')}</button>
                ))}
              </div>
            </div>

            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Skills (comma-separated)</span><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. copy-editing, social media, data analysis" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" /></label>
            <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Availability</span><input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="e.g. 2 hours per week, event weekends only" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" /></label>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

            <button type="submit" disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-6 py-3 hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Submitting…' : 'Volunteer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
