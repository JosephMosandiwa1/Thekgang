import type { Metadata } from 'next';
import { getSupabase } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const sb = getSupabase();
  if (!sb) return {};

  const isNumeric = /^\d+$/.test(params.id);
  let data: any = null;

  if (!isNumeric) {
    const res = await sb.from('events').select('title, description, cover_image_url').eq('slug', params.id).single();
    data = res.data;
  }
  if (!data) {
    const res = await sb.from('events').select('title, description, cover_image_url').eq('id', parseInt(params.id) || 0).single();
    data = res.data;
  }
  if (!data) return {};

  return {
    title: data.title,
    ...(data.description && { description: data.description }),
    openGraph: {
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.cover_image_url && { images: [{ url: data.cover_image_url }] }),
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
