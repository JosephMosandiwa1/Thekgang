import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 60;
const PER_PAGE = 12;

export const metadata: Metadata = {
  title: 'News & Stories · Thekgang',
  description: 'Articles and stories from the books and publishing content creation ecosystem.',
};

interface Post { id: number; slug: string; title: string; excerpt: string; category: string; published_at: string; meta_description: string; cover_image_url: string | null }

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const sb = getSupabase();
  let posts: Post[] = [];
  let totalCount = 0;
  if (sb) {
    const { data, count } = await sb
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, to);
    posts = (data || []) as Post[];
    totalCount = count ?? 0;
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">News &amp; Stories</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>From the sector.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Articles and stories from the content creation ecosystem. <Link href="/podcast" className="link-draw text-black inline-block">Or listen to Zibonele &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="border border-gray-200 rounded p-12 text-center bg-white">
              <p className="text-gray-500 mb-2">No articles published yet.</p>
              <Link href="/join" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Join the council to stay updated &rarr;</Link>
            </div>
          ) : posts.map(p => (
            <Link key={p.id} href={`/news/${p.slug}`} className="group block py-8 border-b border-gray-200 last:border-0 hover:bg-gray-50/50 -mx-4 px-4 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                {p.category && <span className="text-[10px] uppercase tracking-wider text-gray-500">{p.category.replace('_', ' ')}</span>}
                <span className="text-[10px] text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-black mb-2">{p.title}</h2>
              {(p.meta_description || p.excerpt) && <p className="text-sm text-gray-500 leading-relaxed">{p.meta_description || p.excerpt}</p>}
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 group-hover:text-black transition-colors mt-3 inline-block">Read &rarr;</span>
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-10">
              {page > 1 && (
                <Link
                  href={`/news?page=${page - 1}`}
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
                  href={`/news?page=${page + 1}`}
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
