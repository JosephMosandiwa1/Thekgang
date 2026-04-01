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
          <h1 className="text-2xl font-display font-bold text-ink">Website Pages</h1>
          <p className="text-sm text-muted mt-1">Manage public website content — like WordPress but better</p>
        </div>
        <button className="bg-accent text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-accent-light transition-colors">+ New Page</button>
      </div>

      <div className="border border-sand/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
          <span className="col-span-4">Title</span><span className="col-span-3">Slug</span><span className="col-span-2">Status</span><span className="col-span-3">Last Updated</span>
        </div>
        {pages.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No pages yet — create your first page'}</div>
        ) : pages.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors cursor-pointer">
            <span className="col-span-4 text-ink font-medium">{p.title}</span>
            <span className="col-span-3 text-muted text-xs font-mono">/{p.slug}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-sand/60 text-muted'}`}>{p.status}</span></span>
            <span className="col-span-3 text-muted text-xs">{p.updated_at?.split('T')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
