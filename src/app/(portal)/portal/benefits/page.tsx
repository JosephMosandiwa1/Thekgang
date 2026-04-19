'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase/client';

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

interface PaystackPopupInstance {
  newTransaction: (opts: {
    key: string;
    email: string;
    amount: number;
    access_code: string;
    reference: string;
    onSuccess?: (txn: { reference: string }) => void;
    onCancel?: () => void;
  }) => void;
}
declare global {
  interface Window { PaystackPop?: { setup: () => PaystackPopupInstance } }
}

function UpgradeCTA() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tier, setTier] = useState<'active' | 'patron'>('active');

  async function upgrade() {
    setBusy(true); setMessage(null);
    try {
      const res = await fetch('/api/billing/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_slug: tier }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || 'Could not initiate payment'); setBusy(false); return; }

      if (!window.PaystackPop || !PAYSTACK_PUBLIC_KEY) {
        // Fallback: redirect to hosted page
        window.location.href = data.authorization_url;
        return;
      }

      const popup = window.PaystackPop.setup();
      popup.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: '',
        amount: 0,
        access_code: data.access_code,
        reference: data.reference,
        onSuccess: () => { window.location.href = '/portal/benefits?payment=success'; },
        onCancel: () => { setBusy(false); setMessage('Payment cancelled'); },
      });
    } catch (e) {
      setMessage(String(e));
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 border border-black p-6 bg-gray-50">
      <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-2">Upgrade</p>
      <h3 className="font-display text-xl font-bold mb-2">Unlock more with Active Practitioner</h3>
      <p className="text-sm text-gray-600 mb-4">R 350 / year · all affiliate benefits plus voting rights, grant eligibility, and early sector report access. Or Patron at R 5,000 / year.</p>
      <div className="flex gap-3 flex-wrap">
        <select value={tier} onChange={(e) => setTier(e.target.value as 'active' | 'patron')} className="px-3 py-2 border border-gray-300 bg-white text-sm">
          <option value="active">Active Practitioner — R 350 / year</option>
          <option value="patron">Patron — R 5,000 / year</option>
        </select>
        <button onClick={upgrade} disabled={busy} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50">
          {busy ? 'Preparing…' : 'Upgrade membership'}
        </button>
      </div>
      {message && <p className="text-xs text-red-700 mt-3">{message}</p>}
      {!PAYSTACK_PUBLIC_KEY && <p className="text-xs text-gray-400 mt-3">Payment integration will activate when Paystack keys are supplied.</p>}
    </div>
  );
}

interface Benefit {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  tier_required: string;
  category: string | null;
  icon_name: string | null;
  link_url: string | null;
}

interface Tier { id: number; slug: string; name: string }

const TIER_ORDER: Record<string, number> = { affiliate: 0, active: 1, patron: 2 };

export default function PortalBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [memberTier, setMemberTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase.from('members').select('tier_id').eq('auth_user_id', user.id).maybeSingle();
      if (m && (m as { tier_id: number | null }).tier_id) {
        const { data: t } = await supabase.from('member_tiers').select('*').eq('id', (m as { tier_id: number }).tier_id).maybeSingle();
        setMemberTier(t as Tier | null);
      }

      const { data } = await supabase.from('member_benefits').select('*').eq('active', true).order('order_index');
      setBenefits(((data || []) as unknown) as Benefit[]);
      setLoading(false);
    })();
  }, []);

  const currentTierRank = memberTier ? (TIER_ORDER[memberTier.slug] ?? 0) : 0;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Member benefits</p>
      <h1 className="font-display text-3xl font-bold mb-2">Your benefits</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        Benefits you have access to through Council membership. Some require an Active Practitioner or Patron tier.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {benefits.map((b) => {
            const tierRank = TIER_ORDER[b.tier_required] ?? 0;
            const unlocked = tierRank <= currentTierRank;
            return (
              <div
                key={b.id}
                className={`border p-6 transition-opacity ${unlocked ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  {b.category && (
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{b.category}</p>
                  )}
                  {!unlocked && (
                    <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5">
                      {b.tier_required} tier
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{b.title}</h3>
                {b.description && <p className="text-sm text-gray-600 mb-3">{b.description}</p>}
                {b.link_url && unlocked && (
                  <a
                    href={b.link_url}
                    target="_blank"
                    rel="noopener"
                    className="text-xs uppercase tracking-wider underline hover:no-underline"
                  >
                    Access →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {memberTier?.slug === 'affiliate' && <UpgradeCTA />}
    </div>
  );
}
