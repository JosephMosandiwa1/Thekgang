import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CDCC — Books & Publishing Content Developers and Creators Council',
    short_name: 'CDCC',
    description:
      'The central strategic and coordinating body for South Africa\'s content development and creation sector.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#C5A15A',
    lang: 'en-ZA',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/logos/icon-char-gld.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    categories: ['arts', 'education', 'government'],
  };
}
