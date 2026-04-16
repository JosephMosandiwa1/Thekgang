import { getSupabase } from '@/lib/supabase/server';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thekgang.org.za';

export async function GET() {
  const sb = getSupabase();
  let posts: Array<{ slug: string; title: string; meta_description: string | null; excerpt: string | null; published_at: string; category: string | null }> = [];

  if (sb) {
    const { data } = await sb
      .from('posts')
      .select('slug, title, meta_description, excerpt, published_at, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    posts = (data || []) as typeof posts;
  }

  const items = posts.map((p) => {
    const desc = p.meta_description || p.excerpt || '';
    return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/news/${p.slug}</link>
      <description><![CDATA[${desc}]]></description>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      <guid isPermaLink="true">${SITE_URL}/news/${p.slug}</guid>
      ${p.category ? `<category>${p.category.replace('_', ' ')}</category>` : ''}
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CDCC — Books &amp; Publishing Content Developers and Creators Council</title>
    <link>${SITE_URL}</link>
    <description>News and stories from South Africa's content creation ecosystem.</description>
    <language>en-za</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/feed" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
