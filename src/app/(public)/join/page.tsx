'use client';

import { useState } from 'react';
import { useFormDraft } from '@/components/forms/useFormDraft';
import { FormShell } from '@/components/forms/FormShell';
import { FormStep, type FormStepDefinition } from '@/components/forms/FormStep';
import { combine, required, email, validate } from '@/lib/forms/validators';
import { SA_PROVINCES } from '@/lib/utils';

const TYPES = [
  'author_writer', 'translator', 'designer', 'narrator',
  'publisher_self_publisher', 'research_development', 'editor', 'indexer',
  'proofreader', 'legal_ip', 'layout_designer', 'literary_agent',
  'photographer', 'ai_software', 'other',
];

const LANGUAGES = [
  'English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sepedi', 'Setswana',
  'Sesotho', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele',
];

interface JoinForm {
  // Step 1 · Identity
  name: string;
  email: string;
  phone: string;
  // Step 2 · Practice
  type: string;
  province: string;
  organisation: string;
  // Step 3 · Languages + specialisation
  languages: string[];
  specialisation: string;
  bio: string;
  // Step 4 · Confirm
  popia_consent: boolean;
  // Honeypot
  website_url: string;
}

const INITIAL: JoinForm = {
  name: '', email: '', phone: '',
  type: '', province: '', organisation: '',
  languages: [], specialisation: '', bio: '',
  popia_consent: false,
  website_url: '',
};

const STEPS: FormStepDefinition[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'practice', label: 'Practice' },
  { key: 'languages', label: 'Languages' },
  { key: 'confirm', label: 'Confirm' },
];

export default function JoinPage() {
  const { values: form, setValues: setForm, hasDraft, hydrated, clearDraft, discardDraftAndReset } = useFormDraft<JoinForm>('join-v1', INITIAL);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateCurrentStep(): boolean {
    setError(null);
    if (stepIdx === 0) {
      const errs = validate(form, {
        name: required('Please enter your name.'),
        email: combine(required('Please enter your email.'), email()),
      });
      const first = Object.values(errs)[0];
      if (first) { setError(first); return false; }
    }
    if (stepIdx === 1) {
      const errs = validate(form, {
        type: required('Please pick your role in the value chain.'),
      });
      const first = Object.values(errs)[0];
      if (first) { setError(first); return false; }
    }
    if (stepIdx === 3) {
      if (!form.popia_consent) {
        setError('Please tick the POPIA consent box to continue.');
        return false;
      }
    }
    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  }

  function back() {
    setStepIdx((i) => Math.max(0, i - 1));
  }

  function toggleLang(lang: string) {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
    }));
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
      clearDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="pt-32 pb-20 px-6 text-center min-h-screen">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-black mb-4">You&apos;ve been counted.</h1>
          <p className="text-sm text-gray-500 mb-2">Welcome to the CDCC council, {form.name.split(' ')[0]}.</p>
          <p className="text-xs text-gray-500/60">A confirmation email is on its way. Within two working days, the secretariat will be in touch about next steps.</p>
        </div>
      </div>
    );
  }

  // Wait for draft hydration to avoid SSR mismatch when restoring values.
  if (!hydrated) {
    return (
      <FormShell eyebrow="Membership" title="Be part of the story." intro="Loading…">
        <div />
      </FormShell>
    );
  }

  return (
    <FormShell
      eyebrow="Membership"
      title="Be part of the story."
      intro="Whether you write, illustrate, translate, publish, print, or distribute — you belong here. Every registration strengthens the case for a more inclusive, connected book publishing sector."
    >
      {hasDraft && (
        <div className="mb-6 flex items-center justify-between gap-4 border border-amber-300/40 bg-amber-50 px-4 py-3 rounded text-xs">
          <span className="text-amber-900">We restored an earlier draft — your previous answers are filled in.</span>
          <button
            type="button"
            onClick={discardDraftAndReset}
            className="text-amber-900 underline hover:text-amber-700"
          >
            Start fresh
          </button>
        </div>
      )}

      <FormStep
        steps={STEPS}
        currentIndex={stepIdx}
        onJump={(i) => i <= stepIdx && setStepIdx(i)}
      />

      <form
        onSubmit={(e) => { e.preventDefault(); stepIdx === STEPS.length - 1 ? handleSubmit() : next(); }}
        className="space-y-4 max-w-lg"
      >
        {/* Step 0 · Identity */}
        {stepIdx === 0 && (
          <>
            <Field label="Full Name *">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </>
        )}

        {/* Step 1 · Practice */}
        {stepIdx === 1 && (
          <>
            <Field label="I am a... *">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                required
                className={`${inputCls} capitalize`}
              >
                <option value="">Select your role in the value chain</option>
                {TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Province">
              <select
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select province</option>
                {SA_PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Organisation (if applicable)">
              <input
                value={form.organisation}
                onChange={(e) => setForm((f) => ({ ...f, organisation: e.target.value }))}
                className={inputCls}
              />
            </Field>
          </>
        )}

        {/* Step 2 · Languages + specialisation */}
        {stepIdx === 2 && (
          <>
            <Field label="Languages you work in">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${form.languages.includes(l) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Specialisation / Genre">
              <input
                value={form.specialisation}
                onChange={(e) => setForm((f) => ({ ...f, specialisation: e.target.value }))}
                placeholder="e.g. Poetry, Children's books, Academic, Fiction"
                className={inputCls}
              />
            </Field>
            <Field label="Tell us about yourself">
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                placeholder="A short introduction — your work, your passion, what you need"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </>
        )}

        {/* Step 3 · Confirm */}
        {stepIdx === 3 && (
          <>
            <div className="border border-gray-200 bg-gray-50/50 rounded p-4 space-y-2 text-sm">
              <p className="font-medium text-black">Quick check before you submit:</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Name</strong>  ·  {form.name || '—'}</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Email</strong>  ·  {form.email || '—'}</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Role</strong>  ·  {form.type ? form.type.replace(/_/g, ' ') : '—'}</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Province</strong>  ·  {form.province || '—'}</p>
              {form.organisation && <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Organisation</strong>  ·  {form.organisation}</p>}
              {form.languages.length > 0 && <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Languages</strong>  ·  {form.languages.join(', ')}</p>}
            </div>

            <div className="border border-gray-200 bg-gray-50/50 rounded p-4 mt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.popia_consent}
                  onChange={(e) => setForm((f) => ({ ...f, popia_consent: e.target.checked }))}
                  required
                  className="mt-1"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  <strong>POPIA consent.</strong> I consent to the CDCC processing my personal information for constituency mapping, member communications, and connecting me to relevant programmes and opportunities. I understand I can withdraw consent at any time by emailing the secretariat.
                </span>
              </label>
            </div>
          </>
        )}

        {/* Honeypot */}
        <input
          type="text"
          name="website_url"
          value={form.website_url}
          onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex items-center justify-between pt-4 gap-3">
          {stepIdx > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={submitting}
              className="text-xs uppercase tracking-[0.15em] text-gray-500 hover:text-black px-2 py-2"
            >
              ← Back
            </button>
          ) : <span />}
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3 hover:bg-black/90 transition-colors rounded disabled:opacity-50"
          >
            {submitting
              ? 'Submitting…'
              : stepIdx === STEPS.length - 1
              ? 'Join the Registry'
              : 'Next →'}
          </button>
        </div>

        <p className="text-[10px] text-gray-500/60 text-center mt-2">
          Drafts are saved on your device and resume automatically for 14 days. POPIA-compliant.
        </p>
      </form>
    </FormShell>
  );
}

const inputCls = 'w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white rounded';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">{label}</label>
      {children}
    </div>
  );
}
