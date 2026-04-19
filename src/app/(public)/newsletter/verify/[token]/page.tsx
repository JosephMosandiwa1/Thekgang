'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function NewsletterVerify({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'verifying' | 'ok' | 'invalid'>('verifying');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) { setStatus('invalid'); return; }
      const { data } = await supabase.from('newsletter_subscribers').select('id, email, verified').eq('verify_token', token).maybeSingle();
      if (!data) { setStatus('invalid'); return; }
      const row = data as { id: number; email: string; verified: boolean };
      setEmail(row.email);
      if (!row.verified) {
        await supabase.from('newsletter_subscribers').update({ verified: true, verified_at: new Date().toISOString() }).eq('id', row.id);
      }
      setStatus('ok');
    })();
  }, [token]);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Newsletter confirmation</p>
        {status === 'verifying' && <p className="text-sm text-gray-600">Verifying your subscription…</p>}
        {status === 'ok' && (
          <>
            <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
              You&apos;re in.
            </h1>
            <p className="text-gray-600 mb-8 text-sm">{email} is now confirmed. You&apos;ll receive Council updates to this inbox.</p>
            <Link href="/" className="bg-black text-white text-xs uppercase tracking-wider px-5 py-3 inline-block hover:bg-gray-800">Back to the Council →</Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <h1 className="font-display text-2xl font-bold mb-2">Link expired or invalid</h1>
            <p className="text-sm text-gray-600 mb-6">This confirmation link can&apos;t be used.</p>
            <Link href="/newsletter/subscribe" className="text-sm underline">Try subscribing again →</Link>
          </>
        )}
      </div>
    </div>
  );
}
