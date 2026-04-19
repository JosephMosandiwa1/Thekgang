'use client';

import { useState } from 'react';
import { CDCC_DISCIPLINES, SA_PROVINCES, isEmail } from '@/lib/utils';

const LISTS = [
  { slug: 'general', label: 'Council bulletin' },
  { slug: 'events', label: 'Events announcements' },
  { slug: 'grants', label: 'Grants and bursaries' },
  { slug: 'policy', label: 'Policy and advocacy' },
];

export default function NewsletterSubscribePage() {
  const [form, setForm] = useState({ email: '', full_name: '', province: '', disciplines: [] as string[], lists: ['general'] });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  function toggle<K extends 'disciplines' | 'lists'>(field: K, value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(form.email)) { setError('Enter a valid email'); return; }
    if (form.lists.length === 0) { setError('Pick at least one list'); return; }
    setStatus('sending'); setError(null);
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Subscribe failed'); setStatus('error'); return; }
    setStatus('sent');
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Newsletter</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
          Stay in the loop.
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          Updates on Council activity, sector events, policy, grants, and the Annual Report. No spam. Unsubscribe in one click.
        </p>

        {status === 'sent' ? (
          <div className="border border-green-300 bg-green-50 p-6 text-sm text-green-800">
            Thanks — we sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your subscription.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email *</span>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Full name</span>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Province</span>
              <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black">
                <option value="">—</option>
                {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Your disciplines</span>
              <div className="flex flex-wrap gap-1.5">
                {CDCC_DISCIPLINES.map((d) => (
                  <button type="button" key={d} onClick={() => toggle('disciplines', d)} className={`px-2.5 py-1 text-xs border ${form.disciplines.includes(d) ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:border-black'}`}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Lists to subscribe to</span>
              <div className="space-y-2">
                {LISTS.map((l) => (
                  <label key={l.slug} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.lists.includes(l.slug)} onChange={() => toggle('lists', l.slug)} />
                    <span className="text-sm">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

            <button type="submit" disabled={status === 'sending'} className="bg-black text-white text-xs uppercase tracking-wider px-6 py-3 hover:bg-gray-800 disabled:opacity-50">
              {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
            <p className="text-[10px] text-gray-400 mt-2">
              By subscribing you consent to the Council processing your email in line with POPIA. Unsubscribe any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
