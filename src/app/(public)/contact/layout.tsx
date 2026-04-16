import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Books and Publishing Content Developers and Creators Council.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
