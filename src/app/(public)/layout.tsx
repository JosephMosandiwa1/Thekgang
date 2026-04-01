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
                    : useDarkNav ? 'text-white/50' : 'text-gray-400'
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
            className={`lg:hidden transition-colors ${useDarkNav ? 'text-white/70' : 'text-gray-400'}`}>
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

      {/* ── FOOTER — inverted: white on black ── */}
      <footer className="bg-black text-white/40">
        {/* Newsletter */}
        <div className="border-b border-white/8">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <div className="max-w-lg mx-auto text-center">
              <p className="font-display text-lg text-white tracking-wide mb-2">Stay in the Story</p>
              <p className="text-xs text-white/25 mb-6">News, events, opportunities, and voices from the book publishing value chain.</p>
              <form onSubmit={e => e.preventDefault()} className="flex gap-2">
                <input type="email" placeholder="Your email"
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/40 transition-colors" />
                <button type="submit" className="btn-ink-white px-6 py-3 text-[11px] tracking-[0.15em] uppercase flex-shrink-0">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <p className="font-display text-white text-lg tracking-wide mb-2">Thekgang</p>
              <p className="text-xs text-white/25 leading-relaxed">Book Publishing, Manufacturing &amp; Distribution Cluster</p>
              <p className="text-[10px] text-white/10 mt-4">A DSAC Cultural &amp; Creative Industries Cluster</p>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-3">Navigate</p>
              <div className="space-y-2">
                {['/about', '/programmes', '/events', '/news', '/podcast', '/join'].map(href => (
                  <Link key={href} href={href} className="block footer-link">{href.replace('/', '').replace('-', ' ').replace(/^\w/, c => c.toUpperCase()) || 'Home'}</Link>
                ))}
              </div>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-3">Connect</p>
              <div className="space-y-2">
                <Link href="/contact" className="block footer-link">Contact Us</Link>
                <a href="#" className="block footer-link">Instagram</a>
                <a href="#" className="block footer-link">LinkedIn</a>
              </div>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/15 mb-3">Board</p>
              <div className="space-y-2 text-white/25">
                <p>Terry-Ann Adams, Chair</p>
                <p>Lorraine Sithole, Treasurer</p>
                <p>Melvin Kaabwe, Secretary</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 mt-12 pt-8">
            <p className="text-[10px] text-white/10">&copy; {new Date().getFullYear()} Thekgang NPC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
