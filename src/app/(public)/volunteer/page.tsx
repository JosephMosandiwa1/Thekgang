'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormDraft } from '@/components/forms/useFormDraft';
import { FormShell } from '@/components/forms/FormShell';
import { FormStep, type FormStepDefinition } from '@/components/forms/FormStep';
import { combine, required, email, validate } from '@/lib/forms/validators';

const INTERESTS = [
  'events', 'fundraising', 'communications', 'community_outreach',
  'research', 'sector_survey', 'mentorship', 'translation', 'editorial',
];

interface VolunteerForm {
  // Step 0 · Identity
  full_name: string;
  email: string;
  phone: string;
  // Step 1 · Interests
  interests: string[];
  // Step 2 · Capacity + confirm
  skills: string;
  availability: string;
  // Honeypot
  website_url: string;
}

const INITIAL: VolunteerForm = {
  full_name: '', email: '', phone: '',
  interests: [],
  skills: '', availability: '',
  website_url: '',
};

const STEPS: FormStepDefinition[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'interests', label: 'Interests' },
  { key: 'capacity', label: 'Capacity' },
];

export default function VolunteerPage() {
  const { values: form, setValues: setForm, hasDraft, hydrated, clearDraft, discardDraftAndReset } = useFormDraft<VolunteerForm>('volunteer-v1', INITIAL);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateCurrentStep(): boolean {
    setError(null);
    if (stepIdx === 0) {
      const errs = validate(form, {
        full_name: required('Please enter your name.'),
        email: combine(required('Please enter your email.'), email()),
      });
      const first = Object.values(errs)[0];
      if (first) { setError(first); return false; }
    }
    if (stepIdx === 1) {
      if (form.interests.length === 0) {
        setError('Pick at least one area you would like to help with.');
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

  function toggleInterest(v: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(v) ? f.interests.filter((x) => x !== v) : [...f.interests, v],
    }));
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/volunteer', {
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
          <h1 className="font-display text-3xl font-bold text-black mb-4">Thank you, {form.full_name.split(' ')[0]}.</h1>
          <p className="text-sm text-gray-500 mb-2">A member of the volunteer team will be in touch within a week.</p>
          <p className="text-xs text-gray-500/60"><Link href="/" className="underline">Back to the Council →</Link></p>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <FormShell eyebrow="Volunteer" title="Help us run the Council." intro="Loading…">
        <div />
      </FormShell>
    );
  }

  return (
    <FormShell
      eyebrow="Volunteer"
      title="Help us run the Council."
      intro="We run on volunteer energy — from events to research, community outreach, and sector advocacy. Tell us what you can bring."
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
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
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

        {/* Step 1 · Interests */}
        {stepIdx === 1 && (
          <Field label="Where would you like to help? *">
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors capitalize ${form.interests.includes(i) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {i.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500/60 mt-3">Pick as many as apply. We&apos;ll match you to teams that need your help.</p>
          </Field>
        )}

        {/* Step 2 · Capacity */}
        {stepIdx === 2 && (
          <>
            <Field label="Skills (comma-separated)">
              <input
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                placeholder="e.g. copy-editing, social media, data analysis"
                className={inputCls}
              />
            </Field>
            <Field label="Availability">
              <input
                value={form.availability}
                onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                placeholder="e.g. 2 hours per week, event weekends only"
                className={inputCls}
              />
            </Field>

            <div className="border border-gray-200 bg-gray-50/50 rounded p-4 space-y-2 text-sm mt-4">
              <p className="font-medium text-black">Quick check before you submit:</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Name</strong>  ·  {form.full_name || '—'}</p>
              <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Email</strong>  ·  {form.email || '—'}</p>
              {form.interests.length > 0 && (
                <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Interests</strong>  ·  <span className="capitalize">{form.interests.map((i) => i.replace(/_/g, ' ')).join(', ')}</span></p>
              )}
              {form.availability && <p><strong className="text-xs text-gray-500 uppercase tracking-wide">Availability</strong>  ·  {form.availability}</p>}
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
              ? 'Volunteer'
              : 'Next →'}
          </button>
        </div>

        <p className="text-[10px] text-gray-500/60 text-center mt-2">
          Drafts are saved on your device and resume automatically for 14 days.
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
