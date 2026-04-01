import Link from 'next/link';

/* ============================================================
   Thekgang Homepage — "Ink & Light"
   Black & white at rest. Colour on interaction.
   Typography is the hero. The page is a printed book.
   ============================================================ */

const audiences = [
  { title: 'For Authors', desc: 'You wrote something. We\'ll help you get it from your notebook to a reader\'s hands.', href: '/join', cta: 'Join as Author', hoverClass: 'card-hover' },
  { title: 'For Publishers', desc: 'There\'s a market you\'re not serving. We bring you the manuscripts, translators, and evidence.', href: '/join', cta: 'Partner with Us', hoverClass: 'card-hover-amber' },
  { title: 'For Schools & Libraries', desc: 'Your learners deserve books in their mother tongue. We\'re building that pipeline.', href: '/programmes', cta: 'See Our Work', hoverClass: 'card-hover-emerald' },
  { title: 'For the Industry', desc: 'Printers, distributors, booksellers — there\'s work waiting. We connect manuscripts to markets.', href: '/join', cta: 'Join the Network', hoverClass: 'card-hover-violet' },
];

const programmes = [
  { name: 'Book Value Chain Imbizo', location: 'Kwa-Dukuza, KZN', status: 'Planning' },
  { name: 'Jacana Work Skills Programme', location: 'National', status: 'Active' },
  { name: 'Thekgang Talking Podcast', location: 'National', status: 'Active' },
  { name: 'Author Branding Workshop', location: 'North West', status: 'Planning' },
  { name: 'Indigenous Language Distribution', location: 'Limpopo & Mpumalanga', status: 'Planning' },
];

export default function HomePage() {
  return (
    <div>
      {/* ═══ HERO — Black bg, white text ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black overflow-hidden">
        {/* Subtle ruled-page texture */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,0.5) 48px, rgba(255,255,255,0.5) 49px)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-white/25 text-sm tracking-[0.3em] font-display italic animate-fade-in">
            Every story deserves to be told.
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight leading-[1.1] mt-8 mb-8 animate-fade-in-delay">
            The infrastructure for South Africa&apos;s book publishing value chain.
          </h1>

          <p className="text-sm md:text-base text-white/40 max-w-xl mx-auto leading-relaxed animate-fade-in-delay">
            Supporting authors, illustrators, publishers, printers, and distributors across 9 provinces.
            Building pathways for indigenous language books to reach every bookshelf, school, and home.
          </p>

          {/* Founder voice */}
          <p className="text-xs text-white/20 italic max-w-md mx-auto mt-10 mb-12 animate-fade-in-delay-2">
            &ldquo;The book you need to read hasn&apos;t been published yet. We&apos;re here to change that.&rdquo;
            <span className="block mt-2 not-italic text-white/15">— Terry-Ann Adams, Founder</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay-2">
            <div className="text-center">
              <Link href="/join" className="block btn-ink-white text-xs tracking-[0.15em] uppercase px-10 py-4">
                Join the Registry
              </Link>
              <p className="text-[9px] text-white/15 mt-2">Authors, publishers, printers, distributors — be counted</p>
            </div>
            <div className="text-center">
              <Link href="/events" className="block text-white/30 text-xs tracking-[0.15em] uppercase px-6 py-4 border border-white/10 transition-all hover:border-white/30 hover:text-white/60">
                Upcoming Events
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 text-center">
          <p className="text-[9px] text-white/10 uppercase tracking-[0.2em]">
            A DSAC Cultural &amp; Creative Industries Cluster
          </p>
        </div>
      </section>

      {/* ═══ THE PROBLEM — White bg, black text ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="border-l-[3px] border-black pl-8 py-2">
            <p className="font-display text-2xl md:text-4xl text-black leading-relaxed tracking-tight">
              South Africa&apos;s book publishing industry generates <span className="font-bold">R4 billion</span> annually.
              But the vast majority of that value stays in the hands of a few large publishers.
            </p>
            <p className="text-sm text-gray-500 mt-8 max-w-2xl leading-relaxed">
              Indigenous language titles barely reach bookshelves. Authors can&apos;t find publishers.
              Publishers can&apos;t find distributors. Schools can&apos;t find books in their learners&apos; mother tongue.
              The value chain is fragmented — and the people who need it most are left out.
            </p>
            <p className="text-sm text-black mt-4 font-medium">
              Thekgang exists to connect the dots.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ WHO IS THIS FOR — Light gray bg ═══ */}
      <section className="py-24 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-3">Who is this for</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-14 colour-flash-coral transition-colors cursor-default">
            Whether you write, illustrate, publish, print, or distribute — you belong here.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {audiences.map(a => (
              <Link key={a.title} href={a.href}
                className={`group block bg-white p-8 ${a.hoverClass} transition-all`}>
                <h3 className="font-display text-xl font-bold text-black group-hover:text-black transition-colors mb-3">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">{a.desc}</p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 group-hover:text-black transition-colors">{a.cta} &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROGRAMMES — White bg ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-3">Our Programmes</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4 colour-flash-amber transition-colors cursor-default">
            Building capacity across the value chain.
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mb-12">
            From author workshops to indigenous language book distribution — we go where the need is.
          </p>

          <div className="space-y-0">
            {programmes.map(p => (
              <div key={p.name} className="group flex items-center justify-between py-5 border-b border-gray-200 last:border-0 hover:bg-gray-100/50 -mx-4 px-4 transition-colors cursor-default">
                <div>
                  <p className="text-base font-medium text-black">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.location}</p>
                </div>
                <span className={`badge-bw text-[10px] uppercase tracking-wider px-3 py-1 ${
                  p.status === 'Active' ? 'badge-bw-emerald' : 'badge-bw-amber'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/programmes" className="link-draw text-[11px] uppercase tracking-[0.15em] text-gray-400 hover:text-black transition-colors">
              See all programmes
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 4 PILLARS — Black bg, white text ═══ */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-semibold mb-3">Our Strategy</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mb-14">
            Four pillars. One mission.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {[
              { num: '01', title: 'Build Author Capacity', desc: 'Equip South African authors with the skills to write, brand, and market their work — from first draft to published book.', flash: 'colour-flash-coral' },
              { num: '02', title: 'Transform Consumption', desc: 'Change how local stories are consumed. Indigenous language books belong on every bookshelf, not just in archives.', flash: 'colour-flash-amber' },
              { num: '03', title: 'Support All Talent', desc: 'Whether it\'s your first manuscript or your tenth — emerging and established creators both deserve infrastructure.', flash: 'colour-flash-emerald' },
              { num: '04', title: 'Grow Markets', desc: 'Innovative distribution that gets books where readers are — rural schools, community libraries, online platforms.', flash: 'colour-flash-violet' },
            ].map(p => (
              <div key={p.num} className="group border-t border-white/10 pt-6 cursor-default">
                <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-semibold mb-2 group-hover:text-white/60 transition-colors">{p.num}</p>
                <h3 className={`font-display text-xl font-bold text-white mb-3 ${p.flash} transition-colors`}>{p.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER — White bg ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-display font-bold text-black mx-auto mb-8 transition-all hover:border-black hover:scale-105">TA</div>
          <p className="font-display text-xl md:text-2xl text-black leading-relaxed italic">
            &ldquo;I founded Thekgang because I&apos;ve seen the gaps from the inside — as an author published by Jacana Media,
            I know what it takes to get a book from manuscript to reader. Most South African stories never make that journey.
            We&apos;re building the infrastructure so they can.&rdquo;
          </p>
          <p className="text-sm text-black font-medium mt-8">Terry-Ann Adams</p>
          <p className="text-xs text-gray-400">Founder &amp; Chairperson, Thekgang NPC</p>
          <p className="text-[10px] text-gray-300 mt-1">Author of <em>Those Who Live In Cages</em> &amp; <em>White Chalk</em> (Jacana Media)</p>
        </div>
      </section>

      {/* ═══ CTA — Gray bg ═══ */}
      <section className="py-24 px-6 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4 colour-flash-violet transition-colors cursor-default">
            Be part of the story.
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Authors, illustrators, translators, publishers, printers, distributors, booksellers, libraries, schools —
            if you&apos;re in the book value chain, we want to know you.
          </p>
          <Link href="/join" className="inline-block btn-ink text-xs tracking-[0.15em] uppercase px-10 py-4">
            Join the Registry
          </Link>
        </div>
      </section>
    </div>
  );
}
