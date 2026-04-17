import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 60;
const PER_PAGE = 10;

export const metadata: Metadata = {
  title: 'Zibonele Podcast · Thekgang',
  description: 'Conversations with the people who move South Africa\'s content creation sector.',
};

interface Episode { id: number; title: string; description: string; guest_name: string; guest_title: string; audio_url: string; duration_minutes: number; episode_number: number; season: number }

export default async function PodcastPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const sb = getSupabase();
  let episodes: Episode[] = [];
  let totalCount = 0;
  if (sb) {
    const { data, count } = await sb
      .from('podcast_episodes')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('episode_number', { ascending: false })
      .range(from, to);
    episodes = (data || []) as Episode[];
    totalCount = count ?? 0;
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Podcast</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>Zibonele.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Conversations with the people who move SA&apos;s content creation sector. <Link href="/news" className="link-draw text-black inline-block">Or read our news &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {episodes.length === 0 ? (
            <div className="border border-gray-200 rounded p-16 text-center bg-white">
              <h2 className="font-display text-2xl font-bold text-black mb-3">Coming soon.</h2>
              <p className="text-sm text-gray-500 mb-6">Zibonele is in production.</p>
              <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3">Join the council to be notified</Link>
            </div>
          ) : episodes.map(ep => (
            <div key={ep.id} className="py-8 border-b border-gray-200 last:border-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] text-gray-500/60 font-mono font-semibold">S{String(ep.season).padStart(2, '0')}E{String(ep.episode_number).padStart(2, '0')}</span>
                {ep.duration_minutes && <span className="text-[10px] text-gray-500">{ep.duration_minutes} min</span>}
              </div>
              <h2 className="font-display text-2xl font-bold text-black mb-2">{ep.title}</h2>
              {ep.guest_name && <p className="text-sm text-gray-500">with {ep.guest_name}{ep.guest_title ? ` — ${ep.guest_title}` : ''}</p>}
              {ep.description && <p className="text-sm text-gray-500 leading-relaxed mt-3">{ep.description}</p>}
              {ep.audio_url && <audio controls className="w-full mt-4" preload="none"><source src={ep.audio_url} /></audio>}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-10">
              {page > 1 && (
                <Link
                  href={`/podcast?page=${page - 1}`}
                  className="text-xs uppercase tracking-[0.15em] text-black/50 hover:text-black transition-colors"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-[10px] text-gray-400 tracking-wide">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/podcast?page=${page + 1}`}
                  className="text-xs uppercase tracking-[0.15em] text-black/50 hover:text-black transition-colors"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
