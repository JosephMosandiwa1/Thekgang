import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'The 3-Year Strategic Plan',
  description: "CDCC's strategic framework for growing South Africa's books and publishing sector.",
};

/* ============================================================
   The Plan — CDCC Strategic Framework
   3-year activities + 5-year outcomes.
   VACSA-pattern: phased framework, evidence links, milestones.
   ============================================================ */

const threeYearActivities = [
  {
    num: '01',
    title: 'Strategic Oversight',
    desc: 'Provide overarching strategic direction, policy guidance, and general coordination for the Content Developers and Creators cluster.',
    detail: 'The key role is to ensure that the diverse interests within the sub-sectors are represented. This includes considering the needs of small and medium enterprises, independent creatives, large production companies, and other stakeholders.',
    status: 'Active',
  },
  {
    num: '02',
    title: 'Resource Allocation',
    desc: 'Allocate funding and resources to different sub-sector organisations based on needs and priorities.',
    detail: 'Equitable distribution that sustains small and large enterprises alike, ensuring no discipline is left behind.',
    status: 'Active',
  },
  {
    num: '03',
    title: 'Skills Development',
    desc: 'Support the implementation of training and development programmes tailored to the needs of the publishing sector.',
    detail: 'Programmes designed to help practitioners navigate the evolving industry landscape — from digital publishing to AI-assisted content creation.',
    status: 'Active',
  },
  {
    num: '04',
    title: 'Copyright & IP Framework',
    desc: 'Lobby for a regulatory framework for copyright protection and intellectual property protection.',
    detail: 'Including the prevention of copyright infringements across all content formats — print, digital, audio, and emerging media.',
    status: 'In Progress',
    link: '/advocacy',
  },
  {
    num: '05',
    title: 'Advocacy',
    desc: 'Represent the interests of the entire sector at national and international levels.',
    detail: 'Serve as the main point of contact between the publishing sector and government bodies, ensuring that the sector\'s needs and priorities are addressed in national policies.',
    status: 'Active',
  },
  {
    num: '06',
    title: 'Monitoring & Evaluation',
    desc: 'Assess the performance and impact of sub-sector organisations and initiatives.',
    detail: 'Data-driven accountability ensuring alignment with sector objectives and measurable outcomes.',
    status: 'Planning',
  },
];

const fiveYearOutcomes = [
  { title: 'Unified & well-represented sector', desc: 'Every sub-sector — from independent creatives to large production companies — has a coordinated voice in national policy.' },
  { title: 'Equitable resource allocation', desc: 'Funding and resources distributed based on evidence and need, sustaining enterprises of all sizes.' },
  { title: 'Future-ready workforce', desc: 'A generation of practitioners equipped with the skills to navigate digital transformation, AI, and evolving markets.' },
  { title: 'Robust legislative framework', desc: 'Copyright and intellectual property protection enshrined in law, preventing infringement and protecting livelihoods.' },
  { title: 'Elevated sector influence', desc: 'Consistent advocacy at national and international levels that shapes policy in favour of content creators.' },
  { title: 'Data-driven accountability', desc: 'A monitoring and evaluation culture that tracks performance, impact, and alignment with sector objectives.' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  'Active': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'Planning': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function ThePlanPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-charcoal text-white pattern-overlay-dark relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/icon-gld.svg" alt="" width={16} height={16} className="w-4 h-4 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50">The Plan</p>
          </div>
          <h1 className="font-display font-bold text-white tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>
            Strategic framework<br />for the sector.
          </h1>
          <p className="text-sm text-white/40 max-w-xl mt-6 leading-relaxed">
            CDCC&apos;s mandate spans 3-year activities and 5-year outcomes — from immediate coordination
            to long-term transformation of South Africa&apos;s content development landscape.
          </p>
        </div>
      </section>

      {/* 3-Year Activities */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">3-Year Focus Areas</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-black tracking-tight mb-4">
            What we&apos;re doing now.
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mb-12 leading-relaxed">
            Six strategic pillars guiding CDCC&apos;s activities over the next three years.
            Each addresses a critical need in the content development sector.
          </p>

          <div className="space-y-0">
            {threeYearActivities.map(a => {
              const sc = statusColors[a.status] || statusColors['Planning'];
              return (
                <div key={a.num} className="py-8 border-b rule-gold last:border-0">
                  <div className="flex items-start gap-4">
                    <span className="text-[10px] text-gold/40 font-semibold mt-1 w-6 flex-shrink-0">{a.num}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-lg font-bold text-black type-breathe">{a.title}</h3>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold ${sc.bg} ${sc.text}`}>{a.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{a.desc}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{a.detail}</p>
                      {a.link && (
                        <Link href={a.link} className="link-draw text-xs text-gold/60 hover:text-gold mt-3 inline-block transition-colors">
                          See our advocacy work &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="pattern-divider" />

      {/* 5-Year Outcomes */}
      <section className="py-20 px-6 bg-paper texture-paper">
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">5-Year Outcomes</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-black tracking-tight mb-4">
            Where this leads.
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mb-12 leading-relaxed">
            The key outcomes over the next five years — building a unified, protected, and future-ready content creation sector.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {fiveYearOutcomes.map((o, i) => (
              <div key={i} className="bg-white p-6 border border-gray-200/60 card-hover transition-all">
                <span className="text-[10px] text-gold/50 font-semibold">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-base font-bold text-black mt-2 mb-2">{o.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-charcoal text-white pattern-overlay-dark relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50 mb-4">Why It Matters</p>
          <p className="font-display text-xl md:text-2xl text-white leading-relaxed italic">
            &ldquo;Unlike fragmented industry bodies that serve narrow interests, CDCC is uniquely positioned
            to represent the full spectrum of stakeholders — from independent creatives to large production companies —
            under a single, coordinated structure.&rdquo;
          </p>
          <Link href="/join" className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-3 mt-10 inline-block">
            Join the Council
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* Context links */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8">
          <Link href="/advocacy" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Copyright &amp; IP advocacy &rarr;</Link>
          <Link href="/ecosystem" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">See the full ecosystem &rarr;</Link>
          <Link href="/stakeholders" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Why affiliate &rarr;</Link>
          <Link href="/about" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Our mandate &rarr;</Link>
        </div>
      </section>
    </div>
  );
}
