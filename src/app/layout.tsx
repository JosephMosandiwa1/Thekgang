import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const hoves = localFont({
  src: '../../public/fonts/tt-hoves-pro.ttf',
  variable: '--font-hoves',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CDCC — Books & Publishing Content Developers and Creators Council',
    template: '%s · CDCC',
  },
  description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector. A DSAC Cultural & Creative Industries Cluster.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thekgang.org.za'),
  openGraph: {
    type: 'website',
    siteName: 'CDCC — Thekgang',
    locale: 'en_ZA',
    images: [{ url: '/logos/og-default.png', width: 1200, height: 630, alt: 'CDCC — Books & Publishing Content Developers and Creators Council' }],
  },
  alternates: {
    types: { 'application/rss+xml': '/api/feed' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hoves.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
