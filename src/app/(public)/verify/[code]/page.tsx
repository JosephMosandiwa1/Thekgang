'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface VerifiedCert {
  certificate_type: string;
  certificate_code: string;
  title: string;
  description: string | null;
  issued_by: string | null;
  issued_at: string;
  expires_at: string | null;
  members: { full_name: string; member_number: string | null; disciplines: string[] };
}

export default function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [cert, setCert] = useState<VerifiedCert | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('member_certificates')
        .select('certificate_type, certificate_code, title, description, issued_by, issued_at, expires_at, members(full_name, member_number, disciplines)')
        .eq('certificate_code', code)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setCert(data as unknown as VerifiedCert);
      }
      setLoading(false);
    })();
  }, [code]);

  const isExpired = cert?.expires_at ? new Date(cert.expires_at) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Image src="/logos/icon-char-gld.svg" alt="CDCC" width={56} height={56} className="mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-1">Public certificate verification</p>
          <h1 className="font-display text-3xl font-bold text-black">Certificate check</h1>
        </div>

        {loading && <p className="text-center text-sm text-gray-500">Verifying…</p>}

        {!loading && notFound && (
          <div className="bg-white border border-red-200 p-8 text-center">
            <p className="text-lg font-display font-bold text-red-700 mb-2">Certificate not found</p>
            <p className="text-sm text-gray-600 mb-4">Code <span className="font-mono text-black">{code}</span> doesn&apos;t match any issued certificate on record.</p>
            <Link href="/" className="text-sm text-black underline">← Back to Council site</Link>
          </div>
        )}

        {!loading && cert && (
          <div className="bg-white border border-gray-200 p-8 shadow-sm">
            {isExpired ? (
              <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs uppercase tracking-wider px-3 py-1.5 inline-block mb-4">
                Expired {cert.expires_at && `on ${formatDate(cert.expires_at, 'long')}`}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-300 text-green-800 text-xs uppercase tracking-wider px-3 py-1.5 inline-block mb-4">
                ✓ Verified
              </div>
            )}

            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-1">{cert.certificate_type.replace(/_/g, ' ')}</p>
            <h2 className="font-display text-2xl font-bold mb-2">{cert.title}</h2>
            {cert.description && <p className="text-sm text-gray-700 mb-6">{cert.description}</p>}

            <div className="border-t border-gray-200 pt-5 space-y-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500/60 mb-0.5">Awarded to</p>
                <p className="font-medium">{cert.members.full_name}</p>
                {cert.members.member_number && <p className="text-xs text-gray-500 font-mono">{cert.members.member_number}</p>}
                {cert.members.disciplines?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{cert.members.disciplines.join(' · ')}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500/60 mb-0.5">Issued</p>
                <p>{formatDate(cert.issued_at, 'long')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500/60 mb-0.5">Issued by</p>
                <p>{cert.issued_by || 'Content Development Council'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500/60 mb-0.5">Certificate code</p>
                <p className="font-mono">{cert.certificate_code}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6 text-xs text-gray-500 text-center">
              Verified against the Council&apos;s member register at the time of page load.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
