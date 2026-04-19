'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function NewsletterUnsubscribe({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'working' | 'ok' | 'invalid'>('working');
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) { setStatus('invalid'); return; }
      const { data } = await supabase.from('newsletter_subscribers').select('id, email').eq('unsub_token', token).maybeSingle();
      if (!data) { setStatus('invalid'); return; }
      const row = data as { id: number; email: string };
      setEmail(row.email);
      await supabase.from('newsletter_subscribers').update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() }).eq('id', row.id);
      setStatus('ok');
    })();
  }, [token]);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Newsletter</p>
        {status === 'working' && <p className="text-sm text-gray-600">Processing…</p>}
        {status === 'ok' && (
          <>
            <h1 className="font-display text-3xl font-bold mb-2">You&apos;re unsubscribed.</h1>
            <p className="text-sm text-gray-600 mb-6">{email} will not receive further Council emails. If this was a mistake, you can resubscribe anytime.</p>
            <Link href="/newsletter/subscribe" className="text-sm underline">Resubscribe →</Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <h1 className="font-display text-2xl font-bold mb-2">Invalid link</h1>
            <Link href="/" className="text-sm underline">Go home →</Link>
          </>
        )}
      </div>
    </div>
  );
}
