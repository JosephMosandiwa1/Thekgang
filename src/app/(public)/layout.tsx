'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ============================================================
   Thekgang Public Layout — "Ink & Light"
   Black & white at rest. Colour on interaction.
   Nav: black text on white. Gradient hover.
   Footer: white on black. Colour hover.
   ============================================================ */

const navLinks = [
  { href: '/about', label: 'Our Story' },
  { href: '/programmes', label: 'Programmes' },
  { href: '/events', label: 'Events' },
  { href: '/news', label: 'News' },
  { href: '/podcast', label: 'Thekgang Talking' },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = pathname === '/';
  const useDarkNav = !scrolled && isHome;

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ── NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        useDarkNav ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl border-b border-gray-200'
      }`}>
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`font-display text-lg tracking-wide transition-colors duration-500 logo-transform ${
            useDarkNav ? 'text-white' : 'text-black'
          }`}>
            Thekgang
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`nav-transform text-[11px] tracking-[0.15em] uppercase ${
                  pathname.startsWith(link.href)
                    ? useDarkNav ? 'text-white' : 'text-black'
                    : useDarkNav ? 'text-white/50' : 'text-gray-500'
                }`}>
                {link.label}
              </Link>
            ))}
            <Link href="/join" className={`text-[11px] tracking-[0.15em] uppercase px-5 py-2 transition-all ${
              useDarkNav
                ? 'btn-ink-white'
                : 'btn-ink'
            }`}>
              Join the Registry
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden transition-colors ${useDarkNav ? 'text-white/70' : 'text-gray-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileOpen
                ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-6 py-6 space-y-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block text-[12px] tracking-[0.1em] uppercase text-gray-500 hover:text-black transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/join" onClick={() => setMobileOpen(false)}
              className="block btn-ink text-[12px] tracking-[0.1em] uppercase px-5 py-3 text-center">
              Join the Registry
            </Link>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* ── FOOTER — a typographic statement ── */}
      <footer className="bg-black text-white overflow-hidden">
        {/* The big statement */}
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <p className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight type-breathe cursor-default">
            Every story<br />
            <span className="text-white/40 colour-flash-coral transition-colors">deserves</span><br />
            to be told.
          </p>
        </div>

        {/* Newsletter — minimal, elegant */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="border-t border-white/15 pt-12 max-w-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Stay in the story</p>
            <form onSubmit={e => e.preventDefault()} className="flex gap-2">
              <input type="email" placeholder="your@email.com"
                className="flex-1 bg-transparent border-b border-white/15 px-0 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/120 transition-colors" />
              <button type="submit" className="text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors type-breathe px-2">
                Subscribe &rarr;
              </button>
            </form>
          </div>
        </div>

        {/* Navigation — horizontal, typographic */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="border-t border-white/15 pt-10">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: '/about', label: 'Our Story' },
                { href: '/programmes', label: 'Programmes' },
                { href: '/events', label: 'Events' },
                { href: '/news', label: 'News' },
                { href: '/podcast', label: 'Thekgang Talking' },
                { href: '/join', label: 'Join the Registry' },
                { href: '/contact', label: 'Contact' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="footer-link text-sm type-breathe">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar — the colophon */}
        <div className="max-w-6xl mx-auto px-6 pb-8">
          <div className="border-t border-white/12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* Logo + mandate */}
            <div>
              <p className="font-display text-xl tracking-wide text-white logo-transform cursor-default">Thekgang</p>
              <p className="text-[10px] text-white/50 mt-1 tracking-wide">Book Publishing, Manufacturing &amp; Distribution Cluster</p>
            </div>

            {/* Board */}
            <div className="flex gap-6">
              {[
                { name: 'Terry-Ann Adams', role: 'Chair' },
                { name: 'Lorraine Sithole', role: 'Treasurer' },
                { name: 'Melvin Kaabwe', role: 'Secretary' },
              ].map(m => (
                <div key={m.name} className="text-right">
                  <p className="text-[10px] text-white/45">{m.name}</p>
                  <p className="text-[9px] text-white/50">{m.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright + DSAC */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-8">
            <p className="text-[9px] text-white/25">&copy; {new Date().getFullYear()} Thekgang NPC</p>
            <p className="text-[9px] text-white/25">A DSAC Cultural &amp; Creative Industries Cluster</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
