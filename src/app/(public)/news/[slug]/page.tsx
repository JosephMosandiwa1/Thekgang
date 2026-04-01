'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Post { id: number; title: string; content: any[]; category: string; published_at: string; cover_image_url: string }

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [params.slug]);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').eq('slug', params.slug).eq('status', 'published').single();
    setPost(data as Post);
    setLoading(false);
  }

  if (loading) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-muted">Loading...</p></div>;
  if (!post) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-muted">Article not found.</p><Link href="/news" className="text-accent text-xs mt-4 inline-block">&larr; Back to news</Link></div>;

  return (
    <div className="pt-28 pb-20 px-6">
      <article className="max-w-3xl mx-auto">
        <Link href="/news" className="text-xs text-muted hover:text-accent transition-colors">&larr; All News</Link>
        <div className="flex items-center gap-3 mt-6 mb-3">
          {post.category && <span className="text-[10px] uppercase tracking-wider text-accent">{post.category.replace('_', ' ')}</span>}
          <span className="text-[10px] text-muted/40">{post.published_at ? new Date(post.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight mb-8">{post.title}</h1>

        {/* Render content blocks */}
        <div className="prose prose-lg max-w-none">
          {Array.isArray(post.content) && post.content.map((block: any, i: number) => {
            if (block.type === 'paragraph') return <p key={i} className="text-sm text-ink/80 leading-relaxed mb-4">{block.text}</p>;
            if (block.type === 'heading') return <h2 key={i} className="font-display text-xl font-bold text-ink mt-8 mb-3">{block.text}</h2>;
            if (block.type === 'quote') return <blockquote key={i} className="border-l-[3px] border-accent pl-6 my-6 italic text-muted">{block.text}</blockquote>;
            return <p key={i} className="text-sm text-ink/80 leading-relaxed mb-4">{typeof block === 'string' ? block : JSON.stringify(block)}</p>;
          })}
          {(!post.content || !Array.isArray(post.content) || post.content.length === 0) && (
            <p className="text-sm text-muted">Article content will be available soon.</p>
          )}
        </div>
      </article>
    </div>
  );
}
