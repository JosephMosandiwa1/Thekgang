import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join CDCC',
  description: 'Become a member of the Books and Publishing Content Developers and Creators Council.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
