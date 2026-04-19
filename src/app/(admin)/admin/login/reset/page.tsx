'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AdminResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError(null);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    if (err) {
      setError(err.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logos/icon-char-gld.svg" alt="CDCC" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="font-display text-xl tracking-wide text-black font-semibold">Reset password</h1>
          <p className="text-xs text-black/40 uppercase tracking-[0.2em] mt-1">Enter your email to receive a link</p>
        </div>

        {status === 'sent' ? (
          <div className="bg-white border border-gray-200 p-6 shadow-sm text-sm text-gray-700">
            Check your inbox. We&apos;ve sent a link to <strong>{email}</strong> for resetting your password.
            <Link href="/admin/login" className="block mt-4 text-black underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="bg-white border border-gray-200 p-6 shadow-sm">
            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-200 text-sm text-black focus:outline-none focus:border-black mb-4"
              placeholder="you@thekgang.org.za"
            />
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold hover:bg-black/90 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/admin/login" className="block text-center text-xs text-gray-500 mt-4 hover:text-black">
              Back to sign in
            </Link>
          </form>
        )}

        <p className="text-center text-[10px] text-black/30 mt-6 tracking-wide">
          Thekgang NPC · Content Developers & Creators Council
        </p>
      </div>
    </div>
  );
}
