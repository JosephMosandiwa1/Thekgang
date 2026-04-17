'use client';

/**
 * EventMiniSite — self-contained event page that bypasses the main
 * CDCC site layout. Each event gets its own nav, footer, and theme.
 *
 * Reads event_sections (ordered, filtered by visible) and renders
 * each section from the SectionRegistry. The theme (accent colour,
 * fonts, hero) comes from event_theme.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { RenderSection, DEFAULT_SECTIONS, SECTION_LABELS } from './SectionRegistry';
import type { SectionProps } from './SectionRegistry';

interface EventMiniSiteProps {
  event: any;
  regCount: number;
}

interface NavItem {
  label: string;
  href: string;
  isCta: boolean;
}

const DEFAULT_THEME: SectionProps['theme'] = {
  accentColor: '#000000',
  darkMode: false,
  fontHeading: 'Playfair Display',
  fontBody: 'DM Sans',
};

export default function EventMiniSite({ event, regCount }: EventMiniSiteProps) {
  const [theme, setTheme] = useState<SectionProps['theme']>(DEFAULT_THEME);
  const [sections, setSections] = useState<Array<{ key: string; label: string; config?: any }>>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [footerData, setFooterData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadMiniSiteData();
  }, [event.id]);

  async function loadMiniSiteData() {
    if (!supabase) return;

    const [themeRes, sectionsRes, navRes, announcementsRes] = await Promise.all([
      supabase.from('event_theme').select('*').eq('event_id', event.id).maybeSingle(),
      supabase.from('event_sections').select('*').eq('event_id', event.id).eq('visible', true).order('sort_order'),
      supabase.from('event_nav').select('*').eq('event_id', event.id).order('sort_order'),
      supabase.from('event_announcements').select('*').eq('event_id', event.id).eq('is_active', true).order('created_at', { ascending: false }),
    ]);

    // Theme
    if (themeRes.data) {
      setTheme({
        accentColor: themeRes.data.accent_color || '#000000',
        accentColor2: themeRes.data.accent_color_2,
        darkMode: themeRes.data.dark_mode || false,
        fontHeading: themeRes.data.font_heading || 'Playfair Display',
        fontBody: themeRes.data.font_body || 'DM Sans',
      });
      setFooterData({
        text: themeRes.data.footer_text,
        contactEmail: themeRes.data.footer_contact_email,
        socialLinks: themeRes.data.footer_social_links,
        logoUrl: themeRes.data.event_logo_url,
      });
    }

    // Sections — if none defined in DB, use defaults for this event type
    if (sectionsRes.data && sectionsRes.data.length > 0) {
      setSections(sectionsRes.data.map((s: any) => ({
        key: s.section_key,
        label: s.label || SECTION_LABELS[s.section_key] || s.section_key,
        config: s.content_override ? { contentOverride: s.content_override, label: s.label } : { label: s.label },
      })));
    } else {
      const defaults = DEFAULT_SECTIONS[event.event_type] || DEFAULT_SECTIONS.event;
      setSections(defaults.map(key => ({
        key,
        label: SECTION_LABELS[key] || key,
      })));
    }

    // Nav — if none defined, auto-generate from sections
    if (navRes.data && navRes.data.length > 0) {
      setNavItems(navRes.data.map((n: any) => ({ label: n.label, href: n.href, isCta: n.is_cta })));
    }
    // (auto-generated nav happens in render if navItems is empty)

    // Announcements
    setAnnouncements((announcementsRes.data || []) as any[]);
  }

  // Auto-generate nav from visible sections (skip hero, share_bar, announcement_bar)
  const NAV_SKIP = new Set(['hero', 'share_bar', 'announcement_bar', 'countdown']);
  const effectiveNav: NavItem[] = navItems.length > 0
    ? navItems
    : sections
        .filter(s => !NAV_SKIP.has(s.key))
        .slice(0, 8)
        .map(s => ({ label: s.label, href: `#${s.key}`, isCta: s.key === 'registration' || s.key === 'tickets' || s.key === 'application_form' }));

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      }
    }, { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 });

    for (const s of sections) {
      if (NAV_SKIP.has(s.key)) continue;
      const el = document.getElementById(s.key);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(href: string) {
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.open(href, '_blank');
    }
  }

  const isPast = event.event_date < new Date().toISOString().split('T')[0];

  return (
    <div
      className="min-h-screen"
      style={{
        '--event-accent': theme.accentColor,
        '--event-accent-2': theme.accentColor2 || theme.accentColor,
        fontFamily: `'${theme.fontBody}', system-ui, sans-serif`,
      } as React.CSSProperties}
    >
      {/* ── ANNOUNCEMENTS BAR ── */}
      {announcements.length > 0 && (
        <div className={`text-center text-xs py-2 px-4 ${announcements[0].announcement_type === 'urgent' ? 'bg-red-600 text-white' : announcements[0].announcement_type === 'warning' ? 'bg-amber-500 text-black' : 'bg-black text-white'}`}>
          {announcements[0].message}
        </div>
      )}

      {/* ── STICKY NAV ── */}
      <nav ref={navRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-12">
          <Link href="/events" className="text-[10px] uppercase tracking-[0.15em] text-black/30 hover:text-black transition-colors">
            ← CDCC Events
          </Link>
          <div className="flex items-center gap-5">
            {effectiveNav.map(item => (
              item.isCta ? (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="text-[10px] uppercase tracking-[0.15em] font-semibold px-4 py-1.5 rounded transition-colors btn-ink"
                >
                  {item.label}
                </button>
              ) : (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className={`text-[10px] uppercase tracking-[0.15em] transition-colors link-draw ${
                    activeSection === item.href.replace('#', '')
                      ? 'text-black font-semibold'
                      : 'text-black/40 hover:text-black'
                  }`}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* ── SECTIONS ── */}
      {sections.map((section) => (
        <div key={section.key} id={section.key}>
          <RenderSection
            sectionKey={section.key}
            event={{ ...event, _regCount: regCount, _isPast: isPast }}
            theme={theme}
            config={section.config}
          />
        </div>
      ))}

      {/* ── CUSTOM FOOTER ── */}
      <footer className="bg-black text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              {footerData?.logoUrl && (
                <img src={footerData.logoUrl} alt="" className="h-10 mb-4 invert" />
              )}
              <p className="font-display text-lg italic text-white/80">{event.title}</p>
              <p className="text-xs text-white/40 mt-1">
                {new Date(event.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                {event.venue ? ` · ${event.venue}` : ''}
              </p>
            </div>
            <div className="text-right">
              {footerData?.contactEmail && (
                <a href={`mailto:${footerData.contactEmail}`} className="text-xs text-white/50 hover:text-white transition-colors block mb-2">
                  {footerData.contactEmail}
                </a>
              )}
              {footerData?.text && (
                <p className="text-xs text-white/30 max-w-xs">{footerData.text}</p>
              )}
              <div className="flex justify-end gap-4 mt-4">
                <Link href="/events" className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-wider">All events</Link>
                <Link href="/" className="text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-wider">CDCC Home</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <p className="text-[9px] text-white/20 uppercase tracking-[0.3em]">
              Books & Publishing Content Developers and Creators Council
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
