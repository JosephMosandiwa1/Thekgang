/**
 * /f/[slug] — public form-render.
 *
 * Loads a published Form by slug and renders the FormRenderer client
 * component. Open/close window enforced server-side; submission POSTs
 * to /api/press/submissions.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FormRenderer } from '@/components/press/FormRenderer';
import type { FormDef } from '@/lib/press/forms/types';

export const dynamic = 'force-dynamic';

async function loadForm(slug: string): Promise<FormDef | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase.from('press_forms').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as unknown as FormDef | null);
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await loadForm(slug);
  if (!form) notFound();

  const now = new Date();
  const openWindowOk = (!form.opens_at || new Date(form.opens_at) <= now) && (!form.closes_at || new Date(form.closes_at) >= now);

  return (
    <main style={{ background: 'var(--bg-2)', minHeight: '100vh', padding: 'var(--space-9) var(--page-pad-x)' }}>
      <article style={{ maxWidth: 640, margin: '0 auto', background: 'var(--bg-1)', padding: 'var(--space-8)', border: '1px solid var(--border-soft)' }}>
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <p className="t-label">CDCC</p>
          <h1 className="t-heading" style={{ marginTop: 'var(--space-2)' }}>{form.title_en}</h1>
          {form.description_en && <p className="t-body" style={{ marginTop: 'var(--space-3)' }}>{form.description_en}</p>}
        </header>

        {!openWindowOk ? (
          <div style={{ padding: 'var(--space-5)', border: '1px solid var(--cdcc-amber)', background: 'rgba(212, 168, 83, 0.08)' }}>
            <p className="t-card-title">This form is not currently open.</p>
            {form.opens_at && new Date(form.opens_at) > now && (
              <p className="t-body-sm" style={{ marginTop: 'var(--space-2)' }}>
                Opens {new Date(form.opens_at).toLocaleString('en-ZA')}.
              </p>
            )}
            {form.closes_at && new Date(form.closes_at) < now && (
              <p className="t-body-sm" style={{ marginTop: 'var(--space-2)' }}>
                Closed {new Date(form.closes_at).toLocaleString('en-ZA')}.
              </p>
            )}
          </div>
        ) : (
          <FormRenderer form={form} />
        )}
      </article>
    </main>
  );
}
