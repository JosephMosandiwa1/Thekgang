import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'CDCC — Books & Publishing Content Developers and Creators Council',
    template: '%s · CDCC',
  },
  description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector. A DSAC Cultural & Creative Industries Cluster.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cdcc.org.za'),
  openGraph: {
    type: 'website',
    siteName: 'CDCC',
    locale: 'en_ZA',
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
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
