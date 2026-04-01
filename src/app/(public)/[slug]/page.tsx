'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Page { id: number; title: string; content: any[]; meta_description: string }

export default function CMSPage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [params.slug]);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('pages').select('*').eq('slug', params.slug).eq('status', 'published').single();
    setPage(data as Page);
    setLoading(false);
  }

  if (loading) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-muted">Loading...</p></div>;
  if (!page) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-muted text-2xl font-display">Page not found.</p></div>;

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight mb-8">{page.title}</h1>
        <div>
          {Array.isArray(page.content) && page.content.map((block: any, i: number) => {
            if (block.type === 'paragraph') return <p key={i} className="text-sm text-ink/80 leading-relaxed mb-4">{block.text}</p>;
            if (block.type === 'heading') return <h2 key={i} className="font-display text-xl font-bold text-ink mt-8 mb-3">{block.text}</h2>;
            if (block.type === 'quote') return <blockquote key={i} className="border-l-[3px] border-accent pl-6 my-6 italic text-muted">{block.text}</blockquote>;
            if (block.type === 'image') return <img key={i} src={block.url} alt={block.alt || ''} className="w-full rounded my-6" />;
            return <p key={i} className="text-sm text-ink/80 leading-relaxed mb-4">{typeof block === 'string' ? block : ''}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
