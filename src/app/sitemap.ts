import type { MetadataRoute } from 'next';
import { getSupabase } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thekgang.org.za';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = getSupabase();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/the-plan`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/programmes`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/events`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/news`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/podcast`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/ecosystem`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/advocacy`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/stakeholders`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/join`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  if (!sb) return staticPages;

  const [{ data: posts }, { data: events }, { data: pages }] = await Promise.all([
    sb.from('posts').select('slug, published_at').eq('status', 'published').order('published_at', { ascending: false }),
    sb.from('events').select('id, slug, updated_at').neq('status', 'draft').order('event_date', { ascending: false }),
    sb.from('pages').select('slug, updated_at').eq('status', 'published'),
  ]);

  const postUrls: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${SITE_URL}/news/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const eventUrls: MetadataRoute.Sitemap = (events || []).map((e) => ({
    url: `${SITE_URL}/events/${e.slug || e.id}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const pageUrls: MetadataRoute.Sitemap = (pages || []).map((p) => ({
    url: `${SITE_URL}/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...postUrls, ...eventUrls, ...pageUrls];
}
