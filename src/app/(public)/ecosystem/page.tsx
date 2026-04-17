import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'DSAC CCI Clusters',
  description: 'All 17 DSAC Cultural & Creative Industries clusters and where books and publishing fits.',
};

/* ============================================================
   Ecosystem — All 17 DSAC CCI Clusters
   Shows CDCC's position within the national programme.
   Context link: every cluster listed, CDCC highlighted.
   ============================================================ */

const clusters = [
  { num: '01', name: 'Theatre, Musical Theatre & Opera', sector: 'Performing Arts' },
  { num: '02', name: 'Dance', sector: 'Performing Arts' },
  { num: '03', name: 'Exhibitions, Events, Festivals & Technical Productions', sector: 'Live Events' },
  { num: '04', name: 'Visual Arts', sector: 'Visual Arts' },
  { num: '05', name: 'Spoken Word, Poetry, Storytelling & Stand-up Comedy', sector: 'Literary & Oral Arts' },
  { num: '06', name: 'Music — Mass Participation & Community-Based', sector: 'Music' },
  { num: '07', name: 'Music — Modern Sounds', sector: 'Music' },
  { num: '08', name: 'Music — Goema, Kaapse Klopse & Folk', sector: 'Music' },
  { num: '09', name: 'Books & Publishing — Content Developers & Creators', sector: 'Books & Publishing', isCDCC: true },
  { num: '10', name: 'Books & Publishing — Manufacturing & Distribution', sector: 'Books & Publishing' },
  { num: '11', name: 'Film, Cinema & Television', sector: 'Screen' },
  { num: '12', name: 'New Media', sector: 'Digital' },
  { num: '13', name: 'Animation & Gaming', sector: 'Digital' },
  { num: '14', name: 'Product, Jewellery, Fashion & Textile Design', sector: 'Design' },
  { num: '15', name: 'Craft', sector: 'Craft & Heritage' },
  { num: '16', name: 'Communication Design & Interior Design', sector: 'Design' },
  { num: '17', name: 'Arts Education', sector: 'Education' },
];

const sectorGroups = [
  { label: 'Performing Arts', color: 'text-red-600' },
  { label: 'Live Events', color: 'text-orange-600' },
  { label: 'Visual Arts', color: 'text-purple-600' },
  { label: 'Literary & Oral Arts', color: 'text-emerald-600' },
  { label: 'Music', color: 'text-blue-600' },
  { label: 'Books & Publishing', color: 'text-gray-500' },
  { label: 'Screen', color: 'text-pink-600' },
  { label: 'Digital', color: 'text-cyan-600' },
  { label: 'Design', color: 'text-amber-600' },
  { label: 'Craft & Heritage', color: 'text-lime-600' },
  { label: 'Education', color: 'text-indigo-600' },
];

export default function EcosystemPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-black text-white pattern-overlay-dark relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logos/icon-gld.svg" alt="" width={16} height={16} className="w-4 h-4 opacity-40" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/50">The Ecosystem</p>
          </div>
          <h1 className="font-display font-bold text-white tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>
            17 clusters.<br />One national programme.
          </h1>
          <p className="text-sm text-white/40 max-w-xl mt-6 leading-relaxed">
            The Department of Sport, Arts &amp; Culture established 17 Cultural &amp; Creative Industries clusters
            to coordinate, professionalise, and advocate for South Africa&apos;s creative economy. CDCC is one of them.
          </p>
        </div>
      </section>

      {/* DSAC Context */}
      <section className="py-16 px-6 bg-gray-50 texture-paper">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">The Programme</p>
            <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-6">Department of Sport, Arts &amp; Culture</h2>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>The CCI cluster programme emerged from the <strong className="text-black">2022 CCI Masterplan</strong> and was formalised following the CCI Bosberaad in August 2024.</p>
              <p>All 17 clusters were officially launched by <strong className="text-black">Minister Gayton McKenzie</strong> at Nirox Sculpture Park, Krugersdorp on <strong className="text-black">30 March 2026</strong>.</p>
              <p>Each cluster is registered as a <strong className="text-black">Non-Profit Company (NPC)</strong> under South African law, with its own board and a formal Memorandum of Agreement with DSAC.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sector Legend */}
      <section className="py-6 px-6 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {sectorGroups.map(s => (
              <span key={s.label} className={`text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 ${s.color}`}>{s.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* All 17 Clusters */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">All 17 Clusters</p>
          <div className="space-y-0">
            {clusters.map(c => {
              const sectorColor = sectorGroups.find(s => s.label === c.sector)?.color || 'text-gray-500';
              return (
                <div key={c.num}
                  className={`flex items-start gap-4 py-5 border-b border-gray-200 last:border-0 transition-all ${
                    c.isCDCC ? 'bg-black/5 -mx-4 px-4 border-l-2 border-l-gold' : ''
                  }`}>
                  <span className="text-[10px] text-gray-500/40 font-semibold mt-1 w-6 flex-shrink-0">{c.num}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className={`text-base font-medium ${c.isCDCC ? 'text-gray-500' : 'text-black'}`}>
                        {c.name}
                        {c.isCDCC && <span className="ml-2 text-[9px] uppercase tracking-wider bg-black text-white px-2 py-0.5 font-semibold">CDCC</span>}
                      </p>
                    </div>
                    <p className={`text-[10px] uppercase tracking-wider mt-1 ${sectorColor}`}>{c.sector}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What clusters provide */}
      <section className="py-20 px-6 bg-black text-white pattern-overlay-dark relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/50 mb-4">What Clusters Provide</p>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-10">Shared purpose, sector-specific focus.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Industry Training', desc: 'Sector-specific skills development programmes' },
              { title: 'Market Visibility', desc: 'Enhanced exposure for practitioners nationally and internationally' },
              { title: 'Policy Input', desc: 'Direct channels to influence legislation and funding allocation' },
              { title: 'Networking', desc: 'Platforms connecting practitioners across provinces and disciplines' },
              { title: 'IP Protection', desc: 'Intellectual property management and copyright advocacy' },
              { title: 'Government Access', desc: 'Formal engagement channels with DSAC and other departments' },
            ].map(item => (
              <div key={item.title} className="border-t border-black/10 pt-4">
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-50 texture-paper">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-xl font-bold text-black mb-4">CDCC is your cluster.</h2>
          <p className="text-sm text-gray-500 mb-6">If you work in books, publishing, or content creation — this is where your voice gets heard.</p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-gold text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Council</Link>
            <Link href="/about" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Read our mandate &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
