'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Page { id: number; slug: string; title: string; status: string; updated_at: string }

export default function PagesAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('pages').select('*').order('title');
    setPages((data || []) as Page[]);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Website Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public website content — like WordPress but better</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ New Page</button>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-4">Title</span><span className="col-span-3">Slug</span><span className="col-span-2">Status</span><span className="col-span-3">Last Updated</span>
        </div>
        {pages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No pages yet — create your first page'}</div>
        ) : pages.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors cursor-pointer">
            <span className="col-span-4 text-black font-medium">{p.title}</span>
            <span className="col-span-3 text-gray-500 text-xs font-mono">/{p.slug}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-gray-200/60 text-gray-500'}`}>{p.status}</span></span>
            <span className="col-span-3 text-gray-500 text-xs">{p.updated_at?.split('T')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
