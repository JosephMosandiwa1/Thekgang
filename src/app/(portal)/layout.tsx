// Server-component layout · forces dynamic rendering for the portal
// segment so authenticated user state is never statically generated
// (which would leak across users). The interactive shell is a client
// component below, but the route-segment config has to live in a
// server component to take effect.

import PortalShell from './PortalShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
