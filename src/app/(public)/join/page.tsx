'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape'];
const TYPES = ['author', 'illustrator', 'translator', 'publisher', 'printer', 'distributor', 'bookseller', 'library', 'school', 'language_specialist', 'literary_agent', 'editor', 'designer', 'other'];
const LANGUAGES = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sepedi', 'Setswana', 'Sesotho', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele', 'Khoekhoe', 'Other'];

const steps = [
  { num: '01', title: 'Confirmation', desc: 'We acknowledge you — confirmation within 48 hours.' },
  { num: '02', title: 'Connection', desc: 'Linked to your province and role in the value chain.' },
  { num: '03', title: 'Opportunities', desc: 'Matched to programmes, events, and partnerships.' },
  { num: '04', title: 'Representation', desc: 'Your data strengthens the case for the sector.' },
];

export default function JoinPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', province: '', type: '', organisation: '', languages: [] as string[], specialisation: '', bio: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<'quick' | 'full'>('full');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.type) return;
    setSubmitting(true);
    if (supabase) {
      await supabase.from('constituency_submissions').insert({
        name: form.name, email: form.email, phone: form.phone || null,
        province: form.province || null, constituency_type: form.type,
        organisation: form.organisation || null, languages: form.languages,
        specialisation: form.specialisation || null, bio: form.bio || null,
      });
    }
    setSubmitting(false);
    setSubmitted(true);
  }

  const toggleLang = (lang: string) => {
    setForm(f => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang] }));
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 text-center min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-black mb-4">You&apos;ve been counted.</h1>
          <p className="text-sm text-gray-500 mb-2">Welcome to the Thekgang registry, {form.name.split(' ')[0]}.</p>
          <p className="text-xs text-gray-500/60">We&apos;ll be in touch within 48 hours to connect you to your province and relevant opportunities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">
          Be part of the story.
        </h1>
        <p className="text-sm text-gray-500 max-w-xl leading-relaxed mb-4">
          Whether you write, illustrate, translate, publish, print, or distribute — you belong here.
          Every registration strengthens the case for a more inclusive, connected book publishing sector.
        </p>

        {/* What happens when you join */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-10">
          {steps.map(s => (
            <div key={s.num} className="border-t-2 border-black pt-3">
              <p className="text-[10px] text-black tracking-[0.15em] uppercase font-semibold">{s.num}</p>
              <p className="text-sm font-medium text-black mt-1">{s.title}</p>
              <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setMode('full')} className={`text-xs px-4 py-2 rounded transition-colors ${mode === 'full' ? 'bg-black text-white' : 'border border-gray-200 text-gray-500'}`}>Full Profile</button>
          <button onClick={() => setMode('quick')} className={`text-xs px-4 py-2 rounded transition-colors ${mode === 'quick' ? 'bg-black text-white' : 'border border-gray-200 text-gray-500'}`}>Quick Register (30 sec)</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Full Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">I am a... *</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded capitalize">
              <option value="">Select your role in the value chain</option>
              {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Province</label>
            <select value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded">
              <option value="">Select province</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {mode === 'full' && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Organisation (if applicable)</label>
                <input value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Languages you work in</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button" onClick={() => toggleLang(l)}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${form.languages.includes(l) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Specialisation / Genre</label>
                <input value={form.specialisation} onChange={e => setForm(f => ({ ...f, specialisation: e.target.value }))} placeholder="e.g. Poetry, Children's books, Academic, Fiction"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Tell us about yourself</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="A short introduction — your work, your passion, what you need"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded resize-none" />
              </div>
            </>
          )}

          <button type="submit" disabled={submitting}
            className="w-full bg-black text-white text-xs font-medium tracking-[0.15em] uppercase py-4 hover:bg-black-light transition-colors rounded disabled:opacity-50 mt-4">
            {submitting ? 'Submitting...' : 'Join the Registry'}
          </button>

          <p className="text-[10px] text-gray-500/60 text-center mt-4">
            Your information is used solely for constituency mapping and connecting you to relevant opportunities.
            We respect your privacy and comply with POPIA.
          </p>
        </form>
      </div>
    </div>
  );
}
