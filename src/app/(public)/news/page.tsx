'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Post { id: number; slug: string; title: string; excerpt: string; category: string; published_at: string }

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').eq('status', 'published').order('published_at', { ascending: false });
    setPosts((data || []) as Post[]);
    setLoading(false);
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">News &amp; Stories</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>From the value chain.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">Articles and stories from the book publishing ecosystem. <Link href="/podcast" className="link-draw text-black inline-block">Or listen to Thekgang Talking &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? <p className="text-sm text-gray-500 text-center py-12">Loading...</p> : posts.length === 0 ? (
            <div className="border border-gray-200 rounded p-12 text-center bg-white">
              <p className="text-gray-500 mb-2">No articles published yet.</p>
              <Link href="/join" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Join the registry to stay updated &rarr;</Link>
            </div>
          ) : posts.map(p => (
            <Link key={p.id} href={`/news/${p.slug}`} className="group block py-8 border-b border-gray-200 last:border-0 hover:bg-gray-50/50 -mx-4 px-4 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                {p.category && <span className="text-[10px] uppercase tracking-wider text-gray-500">{p.category.replace('_', ' ')}</span>}
                <span className="text-[10px] text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-black type-card-title mb-2">{p.title}</h2>
              {p.excerpt && <p className="text-sm text-gray-500 leading-relaxed">{p.excerpt}</p>}
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 group-hover:text-black transition-colors mt-3 inline-block type-breathe">Read &rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
