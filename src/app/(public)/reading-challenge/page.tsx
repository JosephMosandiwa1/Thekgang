import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';

export const revalidate = 600;

interface Challenge { id: number; slug: string; title: string; description: string | null; year: number | null; theme: string | null; target_books: number; category_prompts: string[]; starts_at: string | null; ends_at: string | null }

export default async function ReadingChallengePage() {
  const sb = getSupabase();
  let current: Challenge | null = null;
  let all: Challenge[] = [];
  if (sb) {
    const { data } = await sb.from('reading_challenges').select('*').eq('active', true).order('year', { ascending: false });
    all = (data || []) as Challenge[];
    current = all[0] || null;
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Reading challenge</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Read SA.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-12">
          An annual reading challenge celebrating South African publishing across 11 official languages. Members log progress via the portal · public participants log via email.
        </p>

        {current ? (
          <section>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{current.year} · {current.theme || 'All disciplines'}</p>
            <h2 className="font-display text-2xl font-bold">{current.title}</h2>
            {current.description && <p className="text-sm text-gray-700 mt-3 mb-6">{current.description}</p>}
            <p className="text-sm mb-6">Target: <strong>{current.target_books} books</strong> {current.starts_at && current.ends_at && `· ${new Date(current.starts_at).toLocaleDateString()} – ${new Date(current.ends_at).toLocaleDateString()}`}</p>

            {current.category_prompts.length > 0 && (
              <div className="border border-gray-200 p-6 mb-6">
                <h3 className="font-display text-lg font-bold mb-3">Category prompts</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {current.category_prompts.map((p, i) => <li key={i}>{p}</li>)}
                </ol>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <Link href="/portal/login" className="bg-black text-white text-xs uppercase tracking-wider px-5 py-3 hover:bg-gray-800">Members log your reads →</Link>
              <Link href="/newsletter/subscribe?source=reading_challenge" className="text-xs uppercase tracking-wider border border-black px-5 py-3 hover:bg-black hover:text-white">Get reading prompts by email</Link>
            </div>
          </section>
        ) : (
          <p className="text-sm text-gray-500">The next Council reading challenge is being prepared. Subscribe to the bulletin to be notified when it launches.</p>
        )}
      </div>
    </div>
  );
}
