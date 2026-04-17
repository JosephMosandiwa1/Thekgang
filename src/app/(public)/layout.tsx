'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/* ============================================================
   CDCC Public Layout
   Charcoal & Gold. Literary, refined, intentional.
   Brand marks: horizontal logo (nav), vertical logo (footer),
   icon badge (mobile), seal (trust), patterns (texture).
   ============================================================ */

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/the-plan', label: 'The Plan' },
  { href: '/ecosystem', label: 'Ecosystem' },
  { href: '/advocacy', label: 'Advocacy' },
  { href: '/stakeholders', label: 'Stakeholders' },
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
          <Link href="/" className="logo-transform flex items-center gap-3">
            <Image
              src={useDarkNav ? '/logos/horiz-wht.svg' : '/logos/horiz-char-gld.svg'}
              alt="CDCC"
              width={140}
              height={32}
              className="h-7 w-auto transition-opacity duration-500"
            />
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
              useDarkNav ? 'btn-ink-white' : 'btn-ink'
            }`}>
              Join the Registry
            </Link>
          </div>

          {/* Mobile: brand icon as menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden transition-colors ${useDarkNav ? 'text-white/70' : 'text-gray-500'}`}>
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <Image
                src={useDarkNav ? '/logos/icon-wht.svg' : '/logos/icon-char-gld.svg'}
                alt="Menu"
                width={28}
                height={28}
                className="w-7 h-7"
              />
            )}
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

      {/* ── FOOTER — Brand-rich, literary ── */}
      <footer className="bg-black text-white overflow-hidden">
        {/* Pattern strip at top of footer */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        {/* Statement + Brand seal */}
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 relative">
          {/* Faint seal watermark */}
          <div className="absolute right-6 top-16 opacity-[0.03] pointer-events-none hidden lg:block">
            <Image src="/logos/icon-wht.svg" alt="" width={260} height={260} className="w-64 h-64" />
          </div>

          <p className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight type-breathe cursor-default relative z-10">
            Every story<br />
            <span className="text-gray-500/60 colour-flash-gold transition-colors">deserves</span><br />
            to be told.
          </p>
        </div>

        {/* Newsletter */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="border-t border-white/10 pt-12 max-w-md">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/50 mb-4">Stay in the story</p>
            <form onSubmit={e => e.preventDefault()} className="flex gap-2">
              <input type="email" placeholder="your@email.com"
                className="flex-1 bg-transparent border-b border-white/15 px-0 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-black transition-colors" />
              <button type="submit" className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 hover:text-gray-500 transition-colors type-breathe px-2">
                Subscribe &rarr;
              </button>
            </form>
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="border-t border-white/10 pt-10">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: '/about', label: 'About' },
                { href: '/the-plan', label: 'The Plan' },
                { href: '/ecosystem', label: 'Ecosystem' },
                { href: '/advocacy', label: 'Advocacy' },
                { href: '/stakeholders', label: 'Stakeholders' },
                { href: '/programmes', label: 'Programmes' },
                { href: '/events', label: 'Events' },
                { href: '/join', label: 'Join the Council' },
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

        {/* Bottom bar — vertical logo + board + cluster */}
        <div className="max-w-6xl mx-auto px-6 pb-8">
          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              {/* Brand icon */}
              <Image src="/logos/icon-gld.svg" alt="" width={36} height={36} className="w-9 h-9 opacity-40" />
              <div>
                <p className="text-[10px] text-white/40 tracking-wide font-medium">CDCC</p>
                <p className="text-[9px] text-white/25 tracking-wide">Content Developers &amp; Creators Council</p>
              </div>
            </div>

            <div className="flex gap-6">
              {[
                { name: 'Terry-Ann Adams', role: 'Chair' },
                { name: 'Lorraine Sithole', role: 'Treasurer' },
                { name: 'Melvin Kaabwe', role: 'Secretary' },
              ].map(m => (
                <div key={m.name} className="text-right">
                  <p className="text-[10px] text-white/35">{m.name}</p>
                  <p className="text-[9px] text-white/20">{m.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-8">
            <p className="text-[9px] text-white/20">&copy; {new Date().getFullYear()} CDCC</p>
            <p className="text-[9px] text-white/20">A DSAC Cultural &amp; Creative Industries Cluster &middot; 1 of 17</p>
          </div>
        </div>

        {/* Bottom gold line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </footer>
    </div>
  );
}
