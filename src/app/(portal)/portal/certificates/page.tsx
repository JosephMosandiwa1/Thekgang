'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, copyToClipboard } from '@/lib/utils';

interface Certificate {
  id: number;
  certificate_type: string;
  certificate_code: string;
  title: string;
  description: string | null;
  issued_by: string | null;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  verification_url: string | null;
}

export default function PortalCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
      if (!m) return;
      const { data } = await supabase
        .from('member_certificates')
        .select('*')
        .eq('member_id', (m as { id: number }).id)
        .order('issued_at', { ascending: false });
      setCerts((data || []) as Certificate[]);
      setLoading(false);
    })();
  }, []);

  async function handleCopy(code: string) {
    const url = `${window.location.origin}/verify/${code}`;
    if (await copyToClipboard(url)) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Credentials</p>
      <h1 className="font-display text-3xl font-bold mb-2">Certificates</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        Every certificate you earn through Council events, courses, and programmes is publicly verifiable. Share the verification link as evidence.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : certs.length === 0 ? (
        <p className="text-sm text-gray-500">No certificates yet. Attend an event to earn your first credential.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {certs.map((c) => (
            <div key={c.id} className="border border-gray-200 p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{c.certificate_type.replace(/_/g, ' ')}</p>
              <h3 className="font-display text-lg font-bold mb-1">{c.title}</h3>
              {c.description && <p className="text-sm text-gray-600 mb-3">{c.description}</p>}
              <div className="text-xs text-gray-500 space-y-1 mb-4">
                <p>Issued: <strong className="text-black">{formatDate(c.issued_at, 'long')}</strong></p>
                {c.expires_at && <p>Expires: {formatDate(c.expires_at, 'long')}</p>}
                <p className="font-mono">Code: {c.certificate_code}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {c.pdf_url && (
                  <a href={c.pdf_url} download className="text-xs uppercase tracking-wider border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors">
                    Download PDF
                  </a>
                )}
                <button
                  onClick={() => handleCopy(c.certificate_code)}
                  className="text-xs uppercase tracking-wider border border-gray-300 px-3 py-1.5 hover:border-black hover:text-black transition-colors"
                >
                  {copiedCode === c.certificate_code ? 'Link copied' : 'Copy verification link'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
