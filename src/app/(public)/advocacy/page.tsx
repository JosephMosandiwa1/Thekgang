import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Advocacy \u00b7 Copyright & IP',
  description: "CDCC's advocacy work on copyright, intellectual property, and fair compensation for content creators.",
};

/* ============================================================
   Advocacy — Copyright & Intellectual Property
   Dedicated page for CDCC's core differentiator.
   Context links: /the-plan, /stakeholders, /join
   ============================================================ */

export default function AdvocacyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-charcoal text-white pattern-overlay-dark relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/icon-gld.svg" alt="" width={16} height={16} className="w-4 h-4 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/50">Advocacy</p>
          </div>
          <h1 className="font-display font-bold text-white tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>
            Copyright &amp; intellectual<br />property protection.
          </h1>
          <p className="text-sm text-white/40 max-w-xl mt-6 leading-relaxed">
            Protecting the livelihoods of content creators is not optional — it&apos;s foundational.
            CDCC lobbies for a robust legislative framework that serves practitioners, not just publishers.
          </p>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">The Problem</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-black tracking-tight mb-8 type-grow cursor-default">
            Creators create. Then what?
          </h2>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed max-w-3xl">
            <p>
              South Africa&apos;s content creators — authors, designers, photographers, translators, narrators —
              produce work that generates billions in economic value. But the legislative framework protecting
              their intellectual property has not kept pace with the industry.
            </p>
            <p>
              Copyright infringement, unregulated use of creative works, and inadequate IP protection
              cost practitioners their livelihoods. Independent creators are disproportionately affected.
            </p>
            <p className="font-medium text-black">
              CDCC exists to change this. Copyright and IP advocacy is not one of our priorities — it is the foundation
              on which every other pillar rests.
            </p>
          </div>
        </div>
      </section>

      <div className="pattern-divider" />

      {/* What We're Doing */}
      <section className="py-20 px-6 bg-paper texture-paper">
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Our Advocacy Agenda</p>
          <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-10">
            What CDCC is lobbying for.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Regulatory Framework',
                desc: 'A comprehensive legislative framework for copyright protection that covers print, digital, audio, and emerging media formats.',
              },
              {
                title: 'IP Protection',
                desc: 'Intellectual property safeguards that protect creators\' work from unauthorised reproduction, distribution, and adaptation.',
              },
              {
                title: 'Infringement Prevention',
                desc: 'Mechanisms to detect, report, and prosecute copyright infringement — including digital piracy and AI-generated derivative works.',
              },
              {
                title: 'Creator Rights Education',
                desc: 'Programmes to educate content creators about their rights, licensing options, and how to protect their work commercially.',
              },
              {
                title: 'Fair Compensation',
                desc: 'Advocacy for fair compensation structures that ensure creators benefit proportionally from the commercial use of their work.',
              },
              {
                title: 'International Alignment',
                desc: 'Ensuring South African IP law aligns with international standards and trade agreements to protect creators globally.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 border border-gray-200/60 card-hover transition-all">
                <span className="text-[10px] text-gold/50 font-semibold">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-base font-bold text-black mt-2 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Who This Protects</p>
          <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-10">
            Every discipline in the value chain.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              'Authors', 'Illustrators', 'Photographers', 'Designers', 'Translators',
              'Narrators', 'Self-Publishers', 'Editors', 'AI Developers', 'Literary Agents',
              'Layout Artists', 'Indexers', 'Proofreaders', 'Researchers',
            ].map(cat => (
              <div key={cat} className="bg-paper border border-gray-200/60 px-3 py-3 text-center">
                <p className="text-[11px] font-medium text-charcoal">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-20 px-6 bg-charcoal text-white pattern-overlay-dark relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="font-display text-xl md:text-2xl text-white leading-relaxed italic">
            &ldquo;A sector without intellectual property protection is a sector that cannot sustain itself.
            CDCC&apos;s advocacy ensures that every creator — from first-time author to established publisher —
            has their work legally recognised and commercially protected.&rdquo;
          </p>
          <p className="text-xs text-gold/40 mt-6">CDCC Advocacy Position</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-paper texture-paper">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-xl font-bold text-black mb-4">Strengthen the voice.</h2>
          <p className="text-sm text-gray-500 mb-6">
            The more practitioners CDCC represents, the stronger our advocacy position.
            Your membership amplifies the call for protection.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-gold text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Council</Link>
            <div className="flex gap-6">
              <Link href="/the-plan" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">See the full plan &rarr;</Link>
              <Link href="/stakeholders" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Why affiliate &rarr;</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
