import Link from 'next/link';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 60;

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string | Array<{ type: string; text: string }>;
  category: string;
  published_at: string;
  cover_image_url: string | null;
  meta_description: string | null;
  excerpt: string | null;
  status: string;
  author_id: string | null;
}

interface Staff {
  first_name: string;
  last_name: string;
  job_title: string | null;
}

async function getPost(slug: string, preview?: string): Promise<{ post: Post | null; author: Staff | null }> {
  const sb = getSupabase();
  if (!sb) return { post: null, author: null };

  let query = sb.from('posts').select('*');

  if (preview) {
    query = query.eq('id', preview);
  } else {
    query = query.eq('slug', slug).eq('status', 'published');
  }

  const { data } = await query.single();
  const post = data as Post | null;
  if (!post) return { post: null, author: null };

  let author: Staff | null = null;
  if (post.author_id) {
    const { data: staffData } = await sb
      .from('staff')
      .select('first_name, last_name, job_title')
      .eq('id', post.author_id)
      .single();
    author = staffData as Staff | null;
  }

  return { post, author };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const { post } = await getPost(slug, preview);
  if (!post) return { title: 'Article not found' };

  const description = post.meta_description || post.excerpt || `Read "${post.title}" on CDCC.`;
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.published_at,
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function ArticlePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const { post, author } = await getPost(slug, preview);

  if (!post) notFound();

  const isPreview = Boolean(preview) && post.status !== 'published';

  return (
    <div className="pt-28 pb-20 px-6">
      <article className="max-w-3xl mx-auto">
        <Link href="/news" className="text-xs text-gray-500 hover:text-black transition-colors">&larr; All News</Link>

        {isPreview && (
          <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800 uppercase tracking-widest font-semibold">
            Preview · Draft · Not yet published
          </div>
        )}

        {post.cover_image_url && (
          <div className="mt-6 rounded-lg overflow-hidden border border-gray-100">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        )}

        <div className="flex items-center gap-3 mt-6 mb-3">
          {post.category && <span className="text-[10px] uppercase tracking-wider text-gray-500/60">{post.category.replace('_', ' ')}</span>}
          <span className="text-[10px] text-gray-500/60">{post.published_at ? new Date(post.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">{post.title}</h1>

        {author && (
          <p className="text-sm text-gray-500 mb-8">
            By <span className="text-black font-medium">{author.first_name} {author.last_name}</span>
            {author.job_title && <span className="text-gray-400"> · {author.job_title}</span>}
          </p>
        )}

        {typeof post.content === 'string' ? (
          post.content.trim() ? (
            <div
              className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black/80 prose-blockquote:border-l-[3px] prose-blockquote:border-black prose-blockquote:text-gray-500 prose-blockquote:italic prose-img:rounded"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <p className="text-sm text-gray-500">Article content will be available soon.</p>
          )
        ) : (
          <div className="prose prose-lg max-w-none">
            {Array.isArray(post.content) && post.content.map((block: { type: string; text: string }, i: number) => {
              if (block.type === 'paragraph') return <p key={i} className="text-sm text-black/80 leading-relaxed mb-4">{block.text}</p>;
              if (block.type === 'heading') return <h2 key={i} className="font-display text-xl font-bold text-black mt-8 mb-3">{block.text}</h2>;
              if (block.type === 'quote') return <blockquote key={i} className="border-l-[3px] border-black pl-6 my-6 italic text-gray-500">{block.text}</blockquote>;
              return <p key={i} className="text-sm text-black/80 leading-relaxed mb-4">{typeof block === 'string' ? block : JSON.stringify(block)}</p>;
            })}
            {(!post.content || !Array.isArray(post.content) || post.content.length === 0) && <p className="text-sm text-gray-500">Article content will be available soon.</p>}
          </div>
        )}
      </article>
    </div>
  );
}
