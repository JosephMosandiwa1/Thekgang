import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Why Affiliate with CDCC',
  description: 'Benefits of joining the Books and Publishing Content Developers and Creators Council.',
};

/* ============================================================
   Stakeholders — Why Affiliate with CDCC
   VACSA-pattern: value proposition, audience-specific benefits.
   Context links: /the-plan, /advocacy, /ecosystem, /join
   ============================================================ */

export default function StakeholdersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-28 pb-16 px-6 seal-watermark seal-watermark-right">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/icon-char-gld.svg" alt="" width={16} height={16} className="w-4 h-4 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60">Stakeholders</p>
          </div>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            Why affiliate with CDCC?
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">
            Practitioners should join because CDCC offers what standalone organisations cannot —
            full-spectrum representation, equitable resource allocation, and direct government access.
          </p>
        </div>
      </section>

      {/* What Makes CDCC Unique */}
      <section className="py-20 px-6 bg-paper texture-paper">
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">What Makes CDCC Different</p>
          <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-10">
            Not fragmented bodies. One coordinated structure.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Full Spectrum Representation',
                desc: 'From independent creatives and small enterprises to large production companies — every practitioner type has a seat.',
                link: '/about',
                linkLabel: 'See all 14 disciplines →',
              },
              {
                title: 'Equitable Resource Allocation',
                desc: 'Funding and resources distributed based on evidence and need — not proximity to power or size of operation.',
                link: '/the-plan',
                linkLabel: 'See the strategic framework →',
              },
              {
                title: 'Copyright & IP Advocacy',
                desc: 'A dedicated mandate to champion intellectual property protection — the single most important issue for content creators.',
                link: '/advocacy',
                linkLabel: 'See our advocacy agenda →',
              },
              {
                title: 'Direct Government Access',
                desc: 'As the designated primary point of contact with DSAC, CDCC ensures your voice reaches national policy-making.',
                link: '/ecosystem',
                linkLabel: 'See the DSAC ecosystem →',
              },
              {
                title: 'Skills Development',
                desc: 'Tailored training programmes that address the real needs of practitioners navigating the evolving industry landscape.',
                link: '/programmes',
                linkLabel: 'See programmes →',
              },
              {
                title: 'National & International Voice',
                desc: 'Representation at the highest levels — ensuring the sector\'s priorities shape policy, not the other way around.',
                link: '/the-plan',
                linkLabel: 'See 5-year outcomes →',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 border border-gray-200/60 card-hover transition-all">
                <span className="text-[10px] text-gold/50 font-semibold">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-base font-bold text-black mt-2 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                <Link href={item.link} className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors">
                  {item.linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Affiliate */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Who Should Affiliate</p>
          <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-10">
            If you create or enable content — you belong here.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-l-2 border-gold/20 pl-6">
              <h3 className="font-display text-lg font-bold text-black mb-3">Individual Practitioners</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Authors, writers, and poets</li>
                <li>Illustrators and photographers</li>
                <li>Translators and narrators</li>
                <li>Editors, proofreaders, and indexers</li>
                <li>Layout and graphic designers</li>
                <li>Literary agents</li>
                <li>AI and software developers in publishing</li>
              </ul>
            </div>
            <div className="border-l-2 border-gold/20 pl-6">
              <h3 className="font-display text-lg font-bold text-black mb-3">Organisations & Enterprises</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Publishing houses (traditional and digital)</li>
                <li>Self-publishing platforms</li>
                <li>Design studios and agencies</li>
                <li>Content production companies</li>
                <li>Research and development firms</li>
                <li>Legal and IP advisory practices</li>
                <li>Educational institutions with publishing programmes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 px-6 bg-charcoal text-white pattern-overlay-dark relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="font-display text-xl md:text-2xl text-white leading-relaxed italic">
            &ldquo;CDCC offers a rare combination of strategic unity and practical advocacy
            tailored specifically to the Content Developers and Creators sector.
            Its distinct value lies in its mandate to not only allocate resources equitably
            but also to champion a robust copyright framework that directly protects practitioners&apos; livelihoods.&rdquo;
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-paper texture-paper">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-xl font-bold text-black mb-4">Ready to affiliate?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Joining CDCC gives you representation, influence, and access that standalone organisations cannot provide.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-gold text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Council</Link>
            <Link href="/contact" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Or get in touch directly &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
