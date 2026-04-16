import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase/server';

export const revalidate = 60;

interface Page { id: number; title: string; content: any; meta_description: string }

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb.from('pages').select('title, meta_description').eq('slug', params.slug).eq('status', 'published').single();
  if (!data) return {};
  return {
    title: data.title,
    ...(data.meta_description && { description: data.meta_description }),
  };
}

export default async function CMSPage({ params }: { params: { slug: string } }) {
  const sb = getSupabase();
  let page: Page | null = null;
  if (sb) {
    const { data } = await sb.from('pages').select('*').eq('slug', params.slug).eq('status', 'published').single();
    page = data as Page;
  }

  if (!page) return <div className="pt-32 pb-20 px-6 text-center"><p className="text-gray-500 text-2xl font-display">Page not found.</p></div>;

  const isHtml = typeof page.content === 'string';

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-8">{page.title}</h1>
        {isHtml ? (
          <div
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-black prose-p:text-black/80 prose-blockquote:border-l-[3px] prose-blockquote:border-gold prose-blockquote:text-gray-500 prose-blockquote:italic prose-img:rounded"
            dangerouslySetInnerHTML={{ __html: page.content as string }}
          />
        ) : (
          <div>
            {Array.isArray(page.content) && page.content.map((block: any, i: number) => {
              if (block.type === 'paragraph') return <p key={i} className="text-sm text-black/80 leading-relaxed mb-4">{block.text}</p>;
              if (block.type === 'heading') return <h2 key={i} className="font-display text-xl font-bold text-black mt-8 mb-3">{block.text}</h2>;
              if (block.type === 'quote') return <blockquote key={i} className="border-l-[3px] border-gold pl-6 my-6 italic text-gray-500">{block.text}</blockquote>;
              if (block.type === 'image') return <img key={i} src={block.url} alt={block.alt || ''} className="w-full rounded my-6" />;
              return <p key={i} className="text-sm text-black/80 leading-relaxed mb-4">{typeof block === 'string' ? block : ''}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
