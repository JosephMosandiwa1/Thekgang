import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cdcc.org.za';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CDCC — Books & Publishing Content Developers and Creators Council',
    template: '%s · CDCC',
  },
  description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector. A DSAC Cultural & Creative Industries Cluster.',
  applicationName: 'CDCC',
  keywords: [
    'CDCC',
    'Content Developers and Creators Council',
    'South African publishing',
    'books',
    'DSAC',
    'cultural and creative industries',
    'sector council',
    'authors',
    'editors',
    'publishers',
  ],
  authors: [{ name: 'CDCC — Books & Publishing' }],
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    siteName: 'CDCC',
    url: SITE_URL,
    title: 'CDCC — Books & Publishing Content Developers and Creators Council',
    description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector.',
    images: [
      {
        url: '/og/home',
        width: 1200,
        height: 630,
        alt: 'CDCC — Books & Publishing Content Developers and Creators Council',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CDCC — Books & Publishing',
    description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector.',
    images: ['/og/home'],
  },
  alternates: {
    canonical: SITE_URL,
    types: { 'application/rss+xml': '/api/feed' },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#2B2B2B' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
