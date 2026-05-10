import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cdcc.org.za';
const SITE_NAME = 'CDCC — Books & Publishing Content Developers and Creators Council';

export interface PageMetaInput {
  /** Page title — root layout's title-template adds " · CDCC" automatically. */
  title: string;
  /** 1–2 sentence description. Used for <meta description>, OG, Twitter. */
  description: string;
  /** Path relative to site root, e.g. '/about'. */
  path: string;
  /** Optional OG image slug (defaults to slug derived from `path`). */
  ogSlug?: string;
  /** Optional override for the OG title (defaults to `title`). */
  ogTitle?: string;
}

/**
 * Per-page metadata helper. Layers on top of the root layout's defaults.
 *
 * Example:
 *   export const metadata = pageMeta({
 *     title: 'About',
 *     description: 'About the Content Developers and Creators Council.',
 *     path: '/about',
 *   });
 */
export function pageMeta(input: PageMetaInput): Metadata {
  const url = `${SITE_URL}${input.path}`;
  const ogSlug = input.ogSlug ?? slugFromPath(input.path);
  const ogImage = `${SITE_URL}/og/${ogSlug}`;
  const ogTitle = input.ogTitle ?? input.title;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: input.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: input.description,
      images: [ogImage],
    },
  };
}

function slugFromPath(path: string): string {
  if (path === '/' || path === '') return 'home';
  return path
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\//g, '-');
}
