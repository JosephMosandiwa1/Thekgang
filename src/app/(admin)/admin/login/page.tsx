'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logos/icon-char-gld.svg"
            alt="CDCC"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="font-display text-xl tracking-wide text-black font-semibold">
            CDCC Corporate OS
          </h1>
          <p className="text-xs text-black/40 uppercase tracking-[0.2em] mt-1">
            Books & Publishing Cluster
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-gray-200/60 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
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
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-gold/30"
              placeholder="you@thekgang.org.za"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-gold/30"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold rounded hover:bg-black/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center mt-4">
            <a href="/admin/login/reset" className="text-xs text-gray-500 hover:text-black transition-colors">
              Forgot password?
            </a>
          </div>
        </form>

        <p className="text-center text-[10px] text-black/30 mt-6 tracking-wide">
          Thekgang NPC · Content Developers & Creators Council
        </p>
      </div>
    </div>
  );
}
