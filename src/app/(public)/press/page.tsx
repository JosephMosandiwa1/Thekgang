import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Press room',
  description: 'Council press releases, media kit, and spokesperson contacts.',
};

interface Release { id: number; slug: string; title: string; summary: string | null; topic: string | null; released_at: string | null; dateline: string | null }
interface Spokes { id: number; name: string; role: string | null; topics: string[]; email: string | null; bio: string | null; available: boolean }

export default async function PressPage() {
  const sb = getSupabase();
  let releases: Release[] = [];
  let spokes: Spokes[] = [];
  if (sb) {
    const [r, s] = await Promise.all([
      sb.from('press_releases').select('id, slug, title, summary, topic, released_at, dateline').eq('status', 'released').order('released_at', { ascending: false }).limit(50),
      sb.from('press_spokespeople').select('id, name, role, topics, email, bio, available').eq('available', true).order('order_index'),
    ]);
    releases = (r.data || []) as Release[];
    spokes = (s.data || []) as Spokes[];
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Press room</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Press &amp; media.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-12">
          Council press releases, official statements, and media contacts. For interview requests, reach out via the spokesperson list below.
        </p>

        <section className="mb-16">
          <h2 className="font-display text-xl font-bold mb-6">Releases</h2>
          {releases.length === 0 ? <p className="text-sm text-gray-500">No releases published yet.</p> : (
            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {releases.map((r) => (
                <Link key={r.id} href={`/press/${r.slug}`} className="block py-5 hover:bg-gray-50 -mx-2 px-2 transition-colors">
                  {r.released_at && <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{new Date(r.released_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}{r.topic && ` · ${r.topic}`}</p>}
                  <h3 className="font-display text-lg font-bold">{r.title}</h3>
                  {r.summary && <p className="text-sm text-gray-600 mt-2">{r.summary}</p>}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="font-display text-xl font-bold mb-6">Spokespeople</h2>
          {spokes.length === 0 ? <p className="text-sm text-gray-500">Contact details available on request.</p> : (
            <div className="grid md:grid-cols-2 gap-4">
              {spokes.map((s) => (
                <div key={s.id} className="border border-gray-200 p-5">
                  <p className="font-display text-lg font-bold">{s.name}</p>
                  {s.role && <p className="text-xs text-gray-600 mb-2">{s.role}</p>}
                  {s.bio && <p className="text-sm text-gray-700 mb-3">{s.bio}</p>}
                  {s.topics.length > 0 && <p className="text-[10px] text-gray-500 mb-2">Topics: {s.topics.join(' · ')}</p>}
                  {s.email && <a href={`mailto:${s.email}`} className="text-xs text-black underline">{s.email}</a>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-4">Media kit</h2>
          <p className="text-sm text-gray-600 mb-4">Logo, brand guide, fact sheet, and usage rules.</p>
          <Link href="/press/media-kit" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">Download media kit →</Link>
        </section>
      </div>
    </div>
  );
}
