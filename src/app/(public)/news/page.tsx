'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Post { id: number; slug: string; title: string; excerpt: string; category: string; published_at: string; cover_image_url: string }

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
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold mb-3">News &amp; Stories</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">From the value chain.</h1>
        <p className="text-sm text-gray-500 max-w-xl mb-12">Articles, press releases, and stories from across South Africa&apos;s book publishing ecosystem.</p>

        {loading ? <p className="text-sm text-gray-500/50 text-center py-12">Loading...</p> : posts.length === 0 ? (
          <div className="border border-gray-200/50 rounded p-12 text-center bg-white">
            <p className="text-gray-500">No articles published yet.</p>
            <p className="text-xs text-gray-500/50 mt-2">Stories are coming — subscribe to our newsletter to be first to read them.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map(p => (
              <Link key={p.id} href={`/news/${p.slug}`} className="block group border border-gray-200/50 rounded overflow-hidden bg-white hover:border-gray-300 hover:shadow-lg transition-all">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-3">
                    {p.category && <span className="text-[10px] uppercase tracking-wider text-black">{p.category.replace('_', ' ')}</span>}
                    <span className="text-[10px] text-gray-500/40">{p.published_at ? new Date(p.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-black group-hover:text-black transition-colors mb-2">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-gray-500 leading-relaxed">{p.excerpt}</p>}
                  <p className="text-[10px] uppercase tracking-[0.15em] text-black mt-4">Read more &rarr;</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
