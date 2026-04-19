'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/portal';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="bg-white border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
        />
      </div>
      <div className="mb-5">
        <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
        />
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold hover:bg-black/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <div className="text-center mt-4 text-xs text-gray-500">
        <Link href="/portal/activate" className="hover:text-black transition-colors">Activate your membership</Link>
        <span className="mx-2">·</span>
        <Link href="/portal/login/reset" className="hover:text-black transition-colors">Forgot password?</Link>
      </div>
    </form>
  );
}

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logos/icon-char-gld.svg" alt="CDCC" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="font-display text-xl tracking-wide text-black font-semibold">Member portal</h1>
          <p className="text-xs text-black/40 uppercase tracking-[0.2em] mt-1">Content Development Council</p>
        </div>

        <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading…</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[10px] text-black/30 mt-6 tracking-wide">
          For practitioners enrolled in the Council
        </p>
      </div>
    </div>
  );
}
