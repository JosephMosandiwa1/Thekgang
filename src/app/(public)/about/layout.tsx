import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CDCC',
  description: 'The central strategic and coordinating body for South Africa\'s content development and creation sector.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
