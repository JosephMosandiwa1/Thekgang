import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Placements } from '@/components/placements/Placements';

/* ============================================================
   CDCC Homepage — Supabase-driven with hardcoded fallback
   ------------------------------------------------------------
   Every section reads from `homepage_content` (editable via
   /admin/home). If Supabase is down or a row is missing, each
   section falls back to the hardcoded defaults below so the
   public site never goes blank.
   ============================================================ */

export const revalidate = 60; // refresh cached content every minute

// ───── HARDCODED FALLBACKS (match migration 003 seed) ─────
const FALLBACK = {
  hero: {
    eyebrow: 'Books & Publishing — Content Developers & Creators',
    headline_line1: 'One sector.',
    headline_line2: 'One voice.',
    headline_line3: 'One council.',
    subcopy:
      "The central strategic and coordinating body for South Africa's content development and creation sector. 14 disciplines. 9 provinces. 1 mandate.",
    cta_primary_label: 'Join the Council',
    cta_primary_href: '/join',
    cta_secondary_label: 'See the Strategic Plan',
    cta_secondary_href: '/the-plan',
    cluster_label: '1 of 17 DSAC Cultural & Creative Industries Clusters →',
    cluster_href: '/ecosystem',
  },
  stakeholders: {
    eyebrow: 'Who We Represent',
    headline: '14 disciplines. One unified voice.',
    subcopy:
      'CDCC represents the full spectrum of content development and creation — from independent creatives to large production companies.',
    read_more_label: 'Read our full mandate →',
    read_more_href: '/about',
    categories: [
      'Authors & Writers',
      'Translators',
      'Designers',
      'Narrators',
      'Publishers & Self-Publishers',
      'Research & Development',
      'Editors',
      'Indexers',
      'Proofreaders',
      'Legal & IP',
      'Layout/Designers',
      'Literary Agents',
      'Photographers',
      'AI & Software',
    ],
    footer_label: 'Find your discipline and join →',
    footer_href: '/join',
  },
  social_proof: {
    items: [
      { eyebrow: 'Mandated by', value: 'Dept. of Sport, Arts & Culture' },
      { eyebrow: 'Cluster Programme', value: '1 of 17 National CCI Clusters' },
      { eyebrow: 'Officially Launched', value: '30 March 2026' },
    ],
  },
  doorways: {
    cards: [
      {
        eyebrow: 'The Mandate',
        title: 'Central strategic body for the content creation sector',
        body: 'CDCC unifies diverse industry stakeholders by providing strategic direction, allocating resources equitably, and fostering skills development to meet evolving demands.',
        stats: ['14 disciplines', '9 provinces', '6 strategic pillars'],
        link_label: 'Read the full mandate →',
        link_href: '/about',
      },
      {
        eyebrow: 'The Ecosystem',
        title: '17 clusters. One national programme.',
        body: "CDCC operates within DSAC's Cultural & Creative Industries cluster programme — alongside theatre, dance, film, music, visual arts, design, and more.",
        tags: ['Theatre', 'Dance', 'Visual Arts', 'Film & TV', 'Music', 'Design', '+11 more'],
        link_label: 'Explore the full ecosystem →',
        link_href: '/ecosystem',
      },
    ],
  },
  audiences: {
    eyebrow: 'Who This Is For',
    headline_line1: 'From independent creatives',
    headline_line2: 'to production companies.',
    cards: [
      {
        title: 'For Content Creators',
        desc: 'Authors, illustrators, photographers, narrators — if you create content in the books and publishing space, CDCC coordinates your representation at the highest levels of government.',
        cta_label: 'Join the Council',
        cta_href: '/join',
        deeper_label: 'Read our mandate →',
        deeper_href: '/about',
        hover_class: 'card-hover',
      },
      {
        title: 'For Publishers & Enterprises',
        desc: 'From independent self-publishers to large production companies — we ensure equitable resource allocation and advocate for your business interests nationally and internationally.',
        cta_label: 'Affiliate Now',
        cta_href: '/join',
        deeper_label: 'See the strategic framework →',
        deeper_href: '/the-plan',
        hover_class: 'card-hover-amber',
      },
      {
        title: 'For Industry Professionals',
        desc: 'Editors, proofreaders, translators, indexers, literary agents, layout designers — the professionals who make publishing happen. CDCC represents the full spectrum.',
        cta_label: 'Register Your Practice',
        cta_href: '/join',
        deeper_label: 'Why affiliate with CDCC →',
        deeper_href: '/stakeholders',
        hover_class: 'card-hover-emerald',
      },
      {
        title: 'For Innovators',
        desc: 'AI & software developers, new media creators, digital-first publishers — the future of content creation is here. CDCC ensures the evolving landscape has a seat at the policy table.',
        cta_label: 'Join as Innovator',
        cta_href: '/join',
        deeper_label: 'Copyright & IP advocacy →',
        deeper_href: '/advocacy',
        hover_class: 'card-hover-violet',
      },
    ],
  },
  pillars: {
    eyebrow: 'Strategic Pillars',
    headline: 'Six pillars. One mandate.',
    subcopy: 'Our 3-year focus areas and 5-year outcomes are built on these foundations.',
    link_label: 'See the full plan →',
    link_href: '/the-plan',
    items: [
      { num: '01', title: 'Strategic Oversight', desc: 'Overarching strategic direction, policy guidance, and coordination for the entire content development sector.', link: '/the-plan' },
      { num: '02', title: 'Resource Allocation', desc: 'Equitable funding and resources to sub-sector organisations based on needs and priorities — from independents to enterprises.', link: '/the-plan' },
      { num: '03', title: 'Skills Development', desc: 'Training and development programmes tailored to navigate the evolving industry landscape.', link: '/programmes' },
      { num: '04', title: 'Copyright & IP', desc: 'Lobbying for a regulatory framework for copyright protection, intellectual property, and the prevention of infringements.', link: '/advocacy' },
      { num: '05', title: 'Advocacy', desc: 'Representing the interests of the entire sector at national and international levels. The main point of contact between publishing and government.', link: '/stakeholders' },
      { num: '06', title: 'Monitoring & Evaluation', desc: 'Data-driven performance assessment ensuring alignment with sector objectives and accountability.', link: '/the-plan' },
    ],
  },
  outcomes: {
    eyebrow: '5-Year Outcomes',
    headline: "Where we're headed.",
    items: [
      { label: 'Unified & represented sector', desc: 'Every sub-sector has a voice. Small enterprises and large companies alike.' },
      { label: 'Equitable resource allocation', desc: 'Funding distributed based on evidence, not proximity.' },
      { label: 'Future-ready workforce', desc: 'Practitioners equipped to navigate the evolving industry landscape.' },
      { label: 'Robust copyright framework', desc: 'Legislative protection for intellectual property across all formats.' },
      { label: 'National & international influence', desc: "The sector's priorities addressed in policy at every level." },
      { label: 'Data-driven accountability', desc: 'Monitoring and evaluation embedded in everything we do.' },
    ],
    link_label: 'See the full strategic framework →',
    link_href: '/the-plan',
  },
  cta: {
    headline: 'Your sector needs your voice.',
    subcopy:
      'Authors, designers, editors, publishers, translators, agents, photographers, narrators, AI developers — if you create or enable content, we represent you.',
    cta_primary_label: 'Join the Council',
    cta_primary_href: '/join',
    link_1_label: 'See the strategic plan →',
    link_1_href: '/the-plan',
    link_2_label: 'Explore the ecosystem →',
    link_2_href: '/ecosystem',
  },
};

async function loadHomepage() {
  if (!supabase) return FALLBACK;
  try {
    const { data } = await supabase.from('homepage_content').select('section_key, content');
    if (!data || data.length === 0) return FALLBACK;
    const map: any = { ...FALLBACK };
    data.forEach((row: any) => {
      if (row.section_key && row.content) {
        map[row.section_key] = { ...FALLBACK[row.section_key as keyof typeof FALLBACK], ...row.content };
      }
    });
    return map;
  } catch {
    return FALLBACK;
  }
}

export default async function HomePage() {
  const content = await loadHomepage();
  const hero = content.hero;
  const stakeholders = content.stakeholders;
  const social_proof = content.social_proof;
  const doorways = content.doorways;
  const audiences = content.audiences;
  const pillars = content.pillars;
  const outcomes = content.outcomes;
  const cta = content.cta;

  return (
    <div>
      {/* Homepage placements — render above the hardcoded homepage if any are live */}
      <Placements slot="homepage_hero" />
      <Placements slot="homepage_announcement" />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'url(/logos/patt-01-wht.svg)', backgroundRepeat: 'repeat', backgroundSize: '200px' }}
        />
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(197, 161, 90, 0.07) 0%, transparent 65%)' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Image src="/logos/icon-wht.svg" alt="" width={500} height={500} className="w-[500px] h-[500px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex justify-center mb-8 animate-fade-in">
            <Image src="/logos/icon-gld.svg" alt="" width={40} height={40} className="w-10 h-10 opacity-40" />
          </div>
          <p className="text-gray-500/50 text-xs tracking-[0.4em] uppercase animate-fade-in mb-8">{hero.eyebrow}</p>
          <h1
            className="font-display font-bold text-white leading-[0.95] tracking-tight animate-fade-in-delay"
            style={{ fontSize: 'clamp(36px, 8vw, 110px)' }}
          >
            {hero.headline_line1}
            <br />
            <span className="text-gray-500/40 hover:text-gray-500/70 transition-colors cursor-default">{hero.headline_line2}</span>
            <br />
            {hero.headline_line3}
          </h1>
          <p className="text-sm text-white/40 max-w-lg mx-auto leading-relaxed mt-10 animate-fade-in-delay">{hero.subcopy}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fade-in-delay-2">
            <Link href={hero.cta_primary_href} className="btn-ink-white text-xs tracking-[0.15em] uppercase px-10 py-4">
              {hero.cta_primary_label}
            </Link>
            <Link
              href={hero.cta_secondary_href}
              className="text-white/35 text-xs tracking-[0.15em] uppercase px-6 py-4 border border-white/10 transition-all hover:border-black/30 hover:text-gray-500/60 type-breathe"
            >
              {hero.cta_secondary_label}
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 text-center animate-fade-in-delay-2 z-10">
          <Link href={hero.cluster_href} className="text-[9px] text-white/30 uppercase tracking-[0.2em] hover:text-gray-500/50 transition-colors">
            {hero.cluster_label}
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent z-10" />
      </section>

      {/* Featured placements strip (shows as a row of up to 3 cards) */}
      <Placements slot="homepage_featured" wrapperClassName="grid md:grid-cols-3 gap-4 px-6 md:px-8 py-12 max-w-6xl mx-auto" />

      {/* Single spotlight placement */}
      <div className="px-6 md:px-8 max-w-6xl mx-auto">
        <Placements slot="homepage_spotlight" />
      </div>

      {/* ═══ STAKEHOLDER CATEGORIES ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">{stakeholders.eyebrow}</p>
          <h2
            className="font-display font-bold text-black tracking-tight mb-4 type-grow cursor-default"
            style={{ fontSize: 'clamp(24px, 4vw, 44px)' }}
          >
            {stakeholders.headline}
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mb-10 leading-relaxed">
            {stakeholders.subcopy}
            <Link href={stakeholders.read_more_href} className="link-draw text-black ml-2 inline-block">
              {stakeholders.read_more_label}
            </Link>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {(stakeholders.categories || []).map((cat: string) => (
              <div
                key={cat}
                className="group bg-gray-50 border border-gray-200/60 px-3 py-3 text-center transition-all hover:border-black/40 hover:bg-white"
              >
                <p className="text-[11px] font-medium text-black group-hover:text-gray-500 transition-colors">{cat}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href={stakeholders.footer_href} className="link-draw text-xs text-gray-500 hover:text-black transition-colors">
              {stakeholders.footer_label}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="py-12 px-6 border-y border-gray-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {(social_proof.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-8 sm:gap-16">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500/50">{item.eyebrow}</p>
                <p className="text-sm font-medium text-black mt-1 type-breathe cursor-default">{item.value}</p>
              </div>
              {i < (social_proof.items?.length || 0) - 1 && <div className="hidden sm:block w-px h-8 bg-black/15" />}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DOORWAY CARDS ═══ */}
      <section className="py-20 px-6 bg-gray-50 texture-paper">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {(doorways.cards || []).map((card: any, i: number) => (
            <div key={i} className="bg-white p-8 border border-gray-200/60 card-hover transition-all">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-3">{card.eyebrow}</p>
              <h3 className="font-display text-lg font-bold text-black mb-3">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{card.body}</p>
              {card.stats && (
                <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-4">
                  {card.stats.map((s: string, j: number) => (
                    <span key={j} className="flex items-center gap-4">
                      <span className="font-medium text-black">{s}</span>
                      {j < card.stats.length - 1 && <span className="w-px h-3 bg-gray-200" />}
                    </span>
                  ))}
                </div>
              )}
              {card.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {card.tags.map((t: string) => (
                    <span key={t} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <Link href={card.link_href} className="link-draw text-xs text-gray-500 hover:text-black transition-colors">
                {card.link_label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ AUDIENCES ═══ */}
      <section className="py-24 px-6 seal-watermark seal-watermark-right">
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-3">{audiences.eyebrow}</p>
          <h2
            className="font-display font-bold text-black tracking-tight mb-14 type-grow cursor-default"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            {audiences.headline_line1}
            <br />
            {audiences.headline_line2}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(audiences.cards || []).map((a: any, i: number) => (
              <div key={i} className={`group bg-white p-8 ${a.hover_class || 'card-hover'} transition-all`}>
                <h3 className="font-display text-xl font-bold text-black type-card-title mb-3">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{a.desc}</p>
                <div className="flex flex-col gap-2">
                  <Link href={a.cta_href} className="btn-ink text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 text-center w-fit">
                    {a.cta_label}
                  </Link>
                  <Link
                    href={a.deeper_href}
                    className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors w-fit"
                  >
                    {a.deeper_label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pattern-divider" />

      {/* ═══ 6 PILLARS ═══ */}
      <section className="py-24 px-6 bg-black text-white pattern-overlay-dark relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <Image src="/logos/icon-gld.svg" alt="" width={20} height={20} className="w-5 h-5 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/50">{pillars.eyebrow}</p>
          </div>
          <h2
            className="font-display font-bold text-white tracking-tight mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            {pillars.headline}
          </h2>
          <p className="text-sm text-white/40 max-w-2xl mb-16 leading-relaxed">
            {pillars.subcopy}
            <Link href={pillars.link_href} className="text-gray-500/40 hover:text-gray-500/60 transition-colors ml-2">
              {pillars.link_label}
            </Link>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(pillars.items || []).map((p: any) => (
              <Link key={p.num} href={p.link} className="group border-t border-black/10 pt-6 block">
                <p className="text-gray-500/40 text-[10px] tracking-[0.2em] uppercase font-semibold mb-2">{p.num}</p>
                <h3 className="font-display text-lg font-bold text-white mb-3 type-lift transition-all">{p.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-3">{p.desc}</p>
                <span className="text-[10px] text-gray-500/30 group-hover:text-gray-500/60 transition-colors">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* ═══ 5-YEAR OUTCOMES ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">{outcomes.eyebrow}</p>
          <h2
            className="font-display font-bold text-black tracking-tight mb-10 type-grow-amber cursor-default"
            style={{ fontSize: 'clamp(24px, 4vw, 44px)' }}
          >
            {outcomes.headline}
          </h2>

          <div className="space-y-0">
            {(outcomes.items || []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-4 py-5 border-b border-gray-200 last:border-0">
                <span className="text-[10px] text-gray-500/50 font-semibold mt-1 w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-base font-medium text-black type-breathe">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href={outcomes.link_href} className="link-draw text-xs text-gray-500 hover:text-black transition-colors">
              {outcomes.link_label}
            </Link>
          </div>
        </div>
      </section>

      <div className="pattern-divider" />

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 px-6 bg-gray-50 texture-paper">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <Image src="/logos/icon-char-gld.svg" alt="" width={32} height={32} className="w-8 h-8 mx-auto mb-6 opacity-30" />
          <h2
            className="font-display font-bold text-black tracking-tight mb-4 type-grow cursor-default"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            {cta.headline}
          </h2>
          <p className="text-sm text-gray-500 mb-10">{cta.subcopy}</p>
          <div className="flex flex-col items-center gap-4">
            <Link href={cta.cta_primary_href} className="btn-gold text-xs tracking-[0.15em] uppercase px-10 py-4">
              {cta.cta_primary_label}
            </Link>
            <div className="flex gap-6">
              <Link href={cta.link_1_href} className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors">
                {cta.link_1_label}
              </Link>
              <Link href={cta.link_2_href} className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors">
                {cta.link_2_label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
