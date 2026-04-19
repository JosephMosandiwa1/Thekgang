'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface MemberLite {
  id: number;
  full_name: string;
  member_number: string | null;
  tier_id: number | null;
  status: string;
}

const NAV = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/events', label: 'Events' },
  { href: '/portal/certificates', label: 'Certificates' },
  { href: '/portal/working-groups', label: 'Working groups' },
  { href: '/portal/sector-data', label: 'Sector data' },
  { href: '/portal/policy', label: 'Policy' },
  { href: '/portal/grants', label: 'Grants' },
  { href: '/portal/copyright', label: 'Copyright' },
  { href: '/portal/books', label: 'My books' },
  { href: '/portal/mentorship', label: 'Mentorship' },
  { href: '/portal/benefits', label: 'Benefits' },
  { href: '/portal/resources', label: 'Resources' },
  { href: '/portal/profile', label: 'Profile' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<MemberLite | null>(null);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === '/portal/login';
  const isActivatePage = pathname.startsWith('/portal/activate');

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && supabase) {
        const { data } = await supabase
          .from('members')
          .select('id, full_name, member_number, tier_id, status')
          .eq('auth_user_id', u.id)
          .maybeSingle();
        setMember(data as MemberLite | null);
      }
      setChecking(false);
      if (!session && !isLoginPage && !isActivatePage) router.replace('/portal/login');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session && !isLoginPage && !isActivatePage) router.replace('/portal/login');
    });
    return () => subscription.unsubscribe();
  }, [isLoginPage, isActivatePage, router]);

  if (isLoginPage || isActivatePage) return <>{children}</>;
  if (checking) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  if (!user) return null;

  const displayName = member?.full_name || user.email?.split('@')[0] || 'Member';

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.replace('/portal/login');
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-gray-200/60 px-6 md:px-10 py-4 sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <Link href="/portal" className="flex items-center gap-3 group">
            <Image src="/logos/icon-char-gld.svg" alt="CDCC" width={28} height={28} />
            <div>
              <p className="font-display text-sm tracking-wide font-semibold">Member portal</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">CDCC</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs tracking-wide ${pathname === link.href ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'} transition-colors`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-xs text-black font-medium">{displayName}</p>
              {member?.member_number && <p className="text-[10px] text-gray-500/60 tracking-wider">{member.member_number}</p>}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-black transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden mt-3 flex gap-5 overflow-x-auto text-xs scrollbar-none">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 ${pathname === link.href ? 'text-black font-semibold' : 'text-gray-500'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">{children}</main>
    </div>
  );
}
