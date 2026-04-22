'use client';

/**
 * The Press · admin shell (Phase A0).
 *
 * Replaces the 8-group / 35-link sidebar with a 14-surface Press
 * registry that's role-filtered. Old routes still resolve — each
 * surface points at its legacy `/admin/*` url for now. As phases
 * A1 → F12 land, each surface's href migrates into the new Press
 * namespace and the legacy routes retire.
 */

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { readCurrentRole } from '@/lib/press/currentRole';
import { ROLES, type PressRole } from '@/lib/press/roles';
import { visibleSurfaces, isAdminRole } from '@/lib/press/surfaces';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<PressRole | null>(null);
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        const r = await readCurrentRole();
        if (mounted) setRole(r);
      }
      setChecking(false);
      if (!session && !isLoginPage) router.replace('/admin/login');
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const r = await readCurrentRole();
        setRole(r);
      } else {
        setRole(null);
      }
      if (!session && !isLoginPage) router.replace('/admin/login');
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-1)',
        color: 'var(--fg-3)',
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
      }}>Loading…</div>
    );
  }
  if (!user) return null;

  const userInitials = (user.email ?? '??').slice(0, 2).toUpperCase();
  const userName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin';
  const roleDef = role ? ROLES[role] : null;
  const groups = visibleSurfaces(role);

  const signOut = async () => {
    await supabase?.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <div className="press-shell">
      <a href="#admin-main" className="skip-link">Skip to main content</a>

      <header className="press-bar" role="banner">
        <div className="press-bar-left">
          <Link href="/admin" className="press-bar-mark" aria-label="The Press — home">
            <Image src="/logos/icon-char-gld.svg" alt="" width={24} height={24} aria-hidden />
            <strong style={{ fontSize: 14 }}>The Press</strong>
            <span>CDCC</span>
          </Link>
          <span className="press-bar-crumb" aria-hidden>{crumbFor(pathname)}</span>
        </div>
        <div className="press-bar-right">
          {roleDef && <span className="press-role" title={roleDef.can}>{roleDef.label}</span>}
          <button
            className="press-burger"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className="press-body">
        <aside className="press-rail" aria-label="Press navigation">
          {!isAdminRole(role) && (
            <div className="press-rail-group">
              <p className="t-label">Access</p>
              <p style={{ fontSize: 12, color: 'var(--fg-2)', margin: 0, lineHeight: 1.5 }}>
                You are signed in but your role does not include admin access. Contact the ED.
              </p>
            </div>
          )}
          {groups.map((group) => (
            <div key={group.title} className="press-rail-group">
              <p className="t-label" style={{ marginBottom: 6 }}>{group.title}</p>
              {group.surfaces.map((surface) => {
                const active =
                  surface.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(surface.href);
                return (
                  <Link
                    key={surface.key}
                    href={surface.href}
                    className="press-rail-link"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span aria-hidden style={{ display: 'inline-block', width: 14, textAlign: 'center', color: active ? 'var(--cdcc-gold)' : 'var(--fg-4)' }}>
                      {surface.glyph}
                    </span>
                    <span>{surface.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="press-user">
            <div className="press-user-initials">{userInitials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="press-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <button className="press-user-signout" onClick={signOut}>Sign out</button>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <div className="press-panel" role="dialog" aria-modal="true" aria-label="Press navigation">
            <div className="press-bar" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <Link href="/admin" className="press-bar-mark" onClick={() => setMenuOpen(false)}>
                <Image src="/logos/icon-char-gld.svg" alt="" width={24} height={24} aria-hidden />
                <strong style={{ fontSize: 14 }}>The Press</strong>
              </Link>
              <button className="press-burger" type="button" aria-label="Close" onClick={() => setMenuOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="press-panel-body">
              {groups.map((group) => (
                <div key={group.title} className="press-rail-group">
                  <p className="t-label" style={{ marginBottom: 6 }}>{group.title}</p>
                  {group.surfaces.map((surface) => (
                    <Link
                      key={surface.key}
                      href={surface.href}
                      className="press-rail-link"
                      aria-current={pathname.startsWith(surface.href) ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span aria-hidden style={{ display: 'inline-block', width: 14, textAlign: 'center', color: 'var(--fg-4)' }}>{surface.glyph}</span>
                      <span>{surface.label}</span>
                      {surface.caption && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-3)' }}>{surface.caption}</span>}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="press-user" style={{ marginTop: 'var(--space-5)' }}>
                <div className="press-user-initials">{userInitials}</div>
                <div style={{ flex: 1 }}>
                  <div className="press-user-name">{userName}</div>
                  <button className="press-user-signout" onClick={signOut}>Sign out</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main id="admin-main" className="press-main">
          <div className="press-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

function crumbFor(pathname: string): string {
  if (pathname === '/admin') return 'Desk · Home';
  const segs = pathname.split('/').filter(Boolean);
  const last = segs[segs.length - 1] ?? '';
  return `Desk · ${last.replace(/-/g, ' ')}`;
}
