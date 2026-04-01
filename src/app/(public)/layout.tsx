'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ============================================================
   Thekgang Public Layout
   Literary warmth — paper bg, ink text, saddle brown accent
   Glass nav on scroll, generous spacing, bookish typography
   Speaks to people, not at them
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
    <div className="min-h-screen bg-paper text-ink">
      {/* ── NAV ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        useDarkNav ? 'bg-transparent' : 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-sand/30'
      }`}>
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className={`font-display text-lg tracking-wide transition-colors duration-500 ${
            useDarkNav ? 'text-white' : 'text-ink'
          } hover:text-accent`}>
            Thekgang
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-accent'
                    : useDarkNav
                      ? 'text-white/60 hover:text-white'
                      : 'text-ink/50 hover:text-ink'
                }`}>
                {link.label}
              </Link>
            ))}
            <Link href="/join"
              className={`text-[11px] tracking-[0.15em] uppercase px-5 py-2 transition-colors ${
                useDarkNav
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-accent text-white hover:bg-accent-light'
              }`}>
              Join the Registry
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden transition-colors ${useDarkNav ? 'text-white/70' : 'text-ink/50'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              {mobileOpen
                ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-sand/30 px-6 py-6 space-y-4">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block text-[12px] tracking-[0.1em] uppercase text-ink/60 hover:text-accent transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/join" onClick={() => setMobileOpen(false)}
              className="block bg-accent text-white text-[12px] tracking-[0.1em] uppercase px-5 py-3 text-center">
              Join the Registry
            </Link>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main>{children}</main>

      {/* ── FOOTER ── */}
      <div className="h-[3px] bg-accent/20" />
      <footer className="bg-ink text-white/50">
        {/* Newsletter */}
        <div className="border-b border-white/8">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <div className="max-w-lg mx-auto text-center">
              <p className="font-display text-lg text-white tracking-wide mb-2">Stay in the Story</p>
              <p className="text-xs text-white/30 mb-6">News, events, opportunities, and voices from the book publishing value chain.</p>
              <form onSubmit={e => e.preventDefault()} className="flex gap-2">
                <input type="email" placeholder="Your email"
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent transition-colors" />
                <button type="submit" className="px-6 py-3 bg-accent text-white text-[11px] tracking-[0.15em] uppercase hover:bg-accent-light transition-colors flex-shrink-0">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer columns */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <p className="font-display text-white text-lg tracking-wide mb-2">Thekgang</p>
              <p className="text-xs text-white/30 leading-relaxed">Book Publishing, Manufacturing &amp; Distribution Cluster</p>
              <p className="text-[10px] text-white/15 mt-4">A DSAC Cultural &amp; Creative Industries Cluster</p>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-3">Navigate</p>
              <div className="space-y-2">
                <Link href="/about" className="block text-white/40 hover:text-white transition-colors">Our Story</Link>
                <Link href="/programmes" className="block text-white/40 hover:text-white transition-colors">Programmes</Link>
                <Link href="/events" className="block text-white/40 hover:text-white transition-colors">Events</Link>
                <Link href="/news" className="block text-white/40 hover:text-white transition-colors">News</Link>
                <Link href="/podcast" className="block text-white/40 hover:text-white transition-colors">Thekgang Talking</Link>
                <Link href="/join" className="block text-white/40 hover:text-white transition-colors">Join the Registry</Link>
              </div>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-3">Connect</p>
              <div className="space-y-2">
                <Link href="/contact" className="block text-white/40 hover:text-white transition-colors">Contact Us</Link>
                <a href="#" className="block text-white/40 hover:text-white transition-colors">Instagram</a>
                <a href="#" className="block text-white/40 hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="block text-white/40 hover:text-white transition-colors">Facebook</a>
              </div>
            </div>
            <div className="text-xs">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-3">Board</p>
              <div className="space-y-2 text-white/40">
                <p>Terry-Ann Adams, Chair</p>
                <p>Lorraine Sithole, Treasurer</p>
                <p>Melvin Kaabwe, Secretary</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 mt-12 pt-8">
            <p className="text-[10px] text-white/15">&copy; {new Date().getFullYear()} Thekgang NPC. Book Publishing, Manufacturing &amp; Distribution Cluster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
