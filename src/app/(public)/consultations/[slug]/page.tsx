'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, isEmail } from '@/lib/utils';

interface Consult {
  id: number; slug: string; title: string; subject: string | null; body: string | null;
  bill_reference: string | null; opens_at: string | null; closes_at: string | null;
  status: string; response_count: number; sign_on_count: number;
  council_position: string | null; council_submission_url: string | null;
}

export default function ConsultationDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [c, setC] = useState<Consult | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', organisation: '', position_stance: '', response_text: '', public: false, signed_on: false });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('consultations').select('*').eq('slug', slug).maybeSingle();
      setC(data as Consult | null);
      setLoading(false);
    })();
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c) return;
    if (!isEmail(form.email)) { setError('Enter a valid email'); return; }
    setSaving(true); setError(null);
    const res = await fetch('/api/consultations/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultation_id: c.id,
        respondent_name: form.name,
        respondent_email: form.email,
        organisation: form.organisation,
        position_stance: form.position_stance || null,
        response_text: form.response_text,
        public: form.public,
        signed_on: form.signed_on,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed'); setSaving(false); return; }
    setSubmitted(true);
    setSaving(false);
  }

  if (loading) return <div className="pt-28 px-6 text-center text-sm text-gray-500">Loading…</div>;
  if (!c) return <div className="pt-28 px-6 text-center"><p className="text-sm text-gray-500 mb-3">Consultation not found.</p><Link href="/consultations" className="underline text-sm">← All consultations</Link></div>;

  const isOpen = c.status === 'open';
  const isClosed = !isOpen;

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/consultations" className="text-xs text-gray-500 hover:text-black">← All consultations</Link>
        <div className="mt-4 mb-8">
          {c.subject && <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{c.subject}{c.bill_reference && ` · ${c.bill_reference}`}</p>}
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.1]" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>{c.title}</h1>
          {c.closes_at && <p className="text-sm text-gray-500 mt-3">{isOpen ? 'Closes' : 'Closed'} {formatDate(c.closes_at, 'long')}</p>}
          <p className="text-xs text-gray-500 mt-1">{c.response_count} responses · {c.sign_on_count} sign-ons</p>
        </div>

        {c.body && <div className="prose prose-sm max-w-none mb-10" dangerouslySetInnerHTML={{ __html: c.body }} />}

        {c.council_position && (
          <div className="border border-black p-5 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">The Council&apos;s position</p>
            <p className="text-sm whitespace-pre-wrap">{c.council_position}</p>
            {c.council_submission_url && <a href={c.council_submission_url} target="_blank" rel="noopener" className="text-xs underline mt-3 inline-block">Download Council submission →</a>}
          </div>
        )}

        {isOpen && !submitted && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4">Add your voice</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Your name *</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm" /></label>
                <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email *</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm" /></label>
              </div>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Organisation</span><input value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm" /></label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Your position</span>
                <select value={form.position_stance} onChange={(e) => setForm({ ...form, position_stance: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm">
                  <option value="">—</option>
                  <option value="support">Support</option>
                  <option value="support_with_amendments">Support with amendments</option>
                  <option value="oppose">Oppose</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
              <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Your response *</span><textarea required rows={6} value={form.response_text} onChange={(e) => setForm({ ...form, response_text: e.target.value })} className="w-full px-3 py-2 border border-gray-300 text-sm" /></label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.public} onChange={(e) => setForm({ ...form, public: e.target.checked })} className="mt-0.5" />Publish my name in the sector summary</label>
              {c.council_position && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.signed_on} onChange={(e) => setForm({ ...form, signed_on: e.target.checked })} className="mt-0.5" />Add my name to the Council&apos;s position</label>}
              {error && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
              <button type="submit" disabled={saving} className="bg-black text-white text-xs uppercase tracking-wider px-6 py-3 hover:bg-gray-800 disabled:opacity-50">{saving ? 'Submitting…' : 'Submit response'}</button>
            </form>
          </section>
        )}

        {submitted && <div className="border border-green-300 bg-green-50 p-6 text-sm text-green-800">Thank you — your response is recorded and will be reflected in the Council&apos;s formal submission.</div>}

        {isClosed && !c.council_submission_url && <p className="text-sm text-gray-500">This consultation is closed. Responses are being compiled into the Council submission.</p>}
      </div>
    </div>
  );
}
