'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Post { id: number; slug: string; title: string; category: string; status: string; published_at: string; created_at: string }

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts((data || []) as Post[]);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">News &amp; Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Articles, press releases, announcements</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ New Post</button>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-4">Title</span><span className="col-span-2">Category</span><span className="col-span-2">Status</span><span className="col-span-2">Published</span><span className="col-span-2">Created</span>
        </div>
        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No posts yet — write your first article'}</div>
        ) : posts.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors cursor-pointer">
            <span className="col-span-4 text-black font-medium">{p.title}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{p.category || '—'}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-gray-200/60 text-gray-500'}`}>{p.status}</span></span>
            <span className="col-span-2 text-gray-500 text-xs">{p.published_at?.split('T')[0] || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs">{p.created_at?.split('T')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
