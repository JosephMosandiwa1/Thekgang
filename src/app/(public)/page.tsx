import Link from 'next/link';

/* ============================================================
   Thekgang Homepage — "Ink & Light"
   ABCS-inspired viewport-scale typography
   VACSA-inspired context-linking (no orphaned information)
   B&W at rest, colour + transform on interaction
   ============================================================ */

const audiences = [
  { title: 'For Authors', desc: 'You wrote something. We help you get it from notebook to reader — through publishing pathways, workshops, and industry connections.', href: '/join', cta: 'Join as Author', deeper: '/programmes', deeperLabel: 'See author programmes →', hoverClass: 'card-hover' },
  { title: 'For Publishers', desc: 'There\'s an underserved market in indigenous languages. We bring you the manuscripts, the translators, and the evidence to justify the print run.', href: '/join', cta: 'Partner with Us', deeper: '/about', deeperLabel: 'Read our mandate →', hoverClass: 'card-hover-amber' },
  { title: 'For Schools & Libraries', desc: 'Your learners deserve books in their mother tongue. We\'re building the distribution pipeline from publisher to classroom.', href: '/programmes', cta: 'See Our Work', deeper: '/events', deeperLabel: 'Upcoming distribution events →', hoverClass: 'card-hover-emerald' },
  { title: 'For the Industry', desc: 'Printers, distributors, booksellers — there\'s work waiting in the value chain. We connect the supply to the demand.', href: '/join', cta: 'Join the Network', deeper: '/about', deeperLabel: 'How the cluster works →', hoverClass: 'card-hover-violet' },
];

const programmes = [
  { name: 'Book Value Chain Imbizo', desc: 'Multi-stakeholder gathering — authors, publishers, printers, distributors.', location: 'Kwa-Dukuza, KZN', status: 'Planning' },
  { name: 'Jacana Work Skills Programme', desc: 'Publishing postgrads researching indigenous language poetry anthologies.', location: 'National', status: 'Active' },
  { name: 'Thekgang Talking Podcast', desc: 'Industry conversations with actors across the book value chain.', location: 'National', status: 'Active' },
  { name: 'Author Branding Workshop', desc: 'Equipping authors to build their brand and market their books.', location: 'North West', status: 'Planning' },
  { name: 'Indigenous Language Distribution', desc: 'Getting books in learners\' mother tongues into schools.', location: 'Limpopo & Mpumalanga', status: 'Planning' },
];

export default function HomePage() {
  return (
    <div>
      {/* ═══ HERO — Viewport-scale typography ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(255,255,255,0.5) 48px, rgba(255,255,255,0.5) 49px)' }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase animate-fade-in mb-8">
            Book Publishing, Manufacturing &amp; Distribution
          </p>

          {/* MASSIVE viewport-scaled headline */}
          <h1 className="font-display font-bold text-white leading-[0.95] tracking-tight animate-fade-in-delay"
            style={{ fontSize: 'clamp(36px, 8vw, 120px)' }}>
            The infrastructure<br />
            <span className="text-white/50 colour-flash-coral transition-colors">your story</span><br />
            has been waiting for.
          </h1>

          <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed mt-10 animate-fade-in-delay">
            Connecting authors, publishers, printers, and distributors
            across 9 provinces. One language at a time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fade-in-delay-2">
            <Link href="/join" className="btn-ink-white text-xs tracking-[0.15em] uppercase px-10 py-4">
              Join the Registry
            </Link>
            <Link href="/programmes" className="text-white/45 text-xs tracking-[0.15em] uppercase px-6 py-4 border border-white/15 transition-all hover:border-white/25 hover:text-white/50 type-breathe">
              Explore Programmes
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 text-center animate-fade-in-delay-2">
          <Link href="/about" className="text-[9px] text-white/50 uppercase tracking-[0.2em] hover:text-white/45 transition-colors">
            A DSAC Cultural &amp; Creative Industries Cluster &rarr;
          </Link>
        </div>
      </section>

      {/* ═══ THREE THINGS — ABCS "things you should know" pattern ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Thing 1 */}
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">01</p>
            <p className="font-display font-bold leading-[1.1] tracking-tight type-grow cursor-default"
              style={{ fontSize: 'clamp(24px, 4vw, 48px)' }}>
              South Africa&apos;s book industry generates R4 billion annually.
              Most of it never reaches indigenous language authors.
            </p>
            <Link href="/about" className="link-draw text-xs text-gray-500 mt-6 inline-block hover:text-black transition-colors">
              See the full industry picture &rarr;
            </Link>
          </div>

          {/* Thing 2 */}
          <div className="max-w-3xl ml-auto text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">02</p>
            <p className="font-display font-bold leading-[1.1] tracking-tight type-grow-amber cursor-default"
              style={{ fontSize: 'clamp(24px, 4vw, 48px)' }}>
              57 books published through the DSAC Publishing Hub —
              including 4 in Khoi and San languages.
            </p>
            <Link href="/programmes" className="link-draw text-xs text-gray-500 mt-6 inline-block hover:text-black transition-colors">
              Read about the Publishing Hub &rarr;
            </Link>
          </div>

          {/* Thing 3 */}
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">03</p>
            <p className="font-display font-bold leading-[1.1] tracking-tight type-grow-emerald cursor-default"
              style={{ fontSize: 'clamp(24px, 4vw, 48px)' }}>
              Thekgang exists to connect the dots —
              from manuscript to reader, one language at a time.
            </p>
            <Link href="/about" className="link-draw text-xs text-gray-500 mt-6 inline-block hover:text-black transition-colors">
              Meet the team behind this &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF — DSAC + Partners (before asking for engagement) ═══ */}
      <section className="py-12 px-6 border-y border-gray-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Mandated by</p>
            <p className="text-sm font-medium text-black mt-1 type-breathe cursor-default">Department of Sport, Arts &amp; Culture</p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Programme Partner</p>
            <p className="text-sm font-medium text-black mt-1 type-breathe cursor-default">Jacana Literary Foundation</p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Cluster Programme</p>
            <p className="text-sm font-medium text-black mt-1 type-breathe cursor-default">1 of 17 National CCI Clusters</p>
          </div>
        </div>
      </section>

      {/* ═══ WHO IS THIS FOR ═══ */}
      <section className="py-24 px-6 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Who is this for</p>
          <h2 className="font-display font-bold text-black tracking-tight mb-14 type-grow cursor-default"
            style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            Whether you write, illustrate, publish,<br />print, or distribute — you belong here.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {audiences.map(a => (
              <div key={a.title} className={`group bg-white p-8 ${a.hoverClass} transition-all`}>
                <h3 className="font-display text-xl font-bold text-black type-card-title mb-3">{a.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{a.desc}</p>
                <div className="flex flex-col gap-2">
                  <Link href={a.href} className="btn-ink text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 text-center w-fit">
                    {a.cta}
                  </Link>
                  <Link href={a.deeper} className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors w-fit">
                    {a.deeperLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROGRAMMES — with context links ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Our Programmes</p>
          <h2 className="font-display font-bold text-black tracking-tight mb-4 type-grow-amber cursor-default"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
            Building capacity across the value chain.
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl mb-12">
            From author workshops to indigenous language book distribution — we go where the need is.
            <Link href="/programmes" className="link-draw text-black ml-2 inline-block">See all programmes &rarr;</Link>
          </p>

          <div className="space-y-0">
            {programmes.map(p => (
              <Link key={p.name} href="/programmes"
                className="group flex items-start justify-between py-6 border-b border-gray-200 last:border-0 hover:bg-gray-50/50 -mx-4 px-4 transition-colors">
                <div className="flex-1">
                  <p className="text-lg font-medium text-black type-breathe">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-500">{p.location}</span>
                    <span className={`badge-bw text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                      p.status === 'Active' ? 'badge-bw-emerald' : 'badge-bw-amber'
                    }`}>{p.status}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 group-hover:text-black transition-colors mt-2 flex-shrink-0 type-breathe">
                  Details &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4 PILLARS — Black bg, each with exit link ═══ */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Our Strategy</p>
          <h2 className="font-display font-bold text-white tracking-tight mb-16"
            style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            Four pillars. One mission.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            {[
              { num: '01', title: 'Build Author Capacity', desc: 'Equip South African authors with the skills to write, brand, and market their work — from first draft to published book.', transform: 'type-lift', link: '/programmes', linkLabel: 'See author programmes →' },
              { num: '02', title: 'Transform Consumption', desc: 'Change how local stories are consumed. Indigenous language books belong on every bookshelf, not just in archives.', transform: 'type-stretch', link: '/about', linkLabel: 'Read our mandate →' },
              { num: '03', title: 'Support All Talent', desc: 'Whether it\'s your first manuscript or your tenth — emerging and established creators both deserve infrastructure.', transform: 'type-bounce', link: '/join', linkLabel: 'Join the registry →' },
              { num: '04', title: 'Grow Markets', desc: 'Innovative distribution that gets books where readers are — rural schools, community libraries, online platforms.', transform: 'type-widen', link: '/programmes', linkLabel: 'See distribution programmes →' },
            ].map(p => (
              <div key={p.num} className="group border-t border-white/10 pt-8">
                <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-semibold mb-3 group-hover:text-white/40 transition-colors">{p.num}</p>
                <h3 className={`font-display text-2xl font-bold text-white mb-4 ${p.transform} transition-all`}>{p.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">{p.desc}</p>
                <Link href={p.link} className="text-[10px] text-white/40 hover:text-white/60 transition-colors type-breathe">
                  {p.linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER — with story link ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-display font-bold text-black mx-auto mb-8 transition-all hover:border-black hover:scale-110 hover:rotate-3 hover:shadow-lg">TA</div>
          <p className="font-display text-xl md:text-2xl text-black leading-relaxed italic">
            &ldquo;I founded Thekgang because I&apos;ve seen the gaps from the inside — as an author published by Jacana Media,
            I know what it takes to get a book from manuscript to reader. Most South African stories never make that journey.
            We&apos;re building the infrastructure so they can.&rdquo;
          </p>
          <p className="text-sm text-black font-medium mt-8">Terry-Ann Adams</p>
          <p className="text-xs text-gray-500">Founder &amp; Chairperson</p>
          <Link href="/about" className="link-draw text-[10px] text-gray-500 mt-4 inline-block hover:text-black transition-colors">
            Read Terry-Ann&apos;s full story &rarr;
          </Link>
        </div>
      </section>

      {/* ═══ CTA — with multiple depth options ═══ */}
      <section className="py-24 px-6 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-black tracking-tight mb-4 type-grow-violet cursor-default"
            style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            Be part of the story.
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Authors, illustrators, translators, publishers, printers, distributors —
            if you&apos;re in the book value chain, we want to know you.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-10 py-4">
              Join the Registry
            </Link>
            <div className="flex gap-6">
              <Link href="/programmes" className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors">
                Explore programmes first &rarr;
              </Link>
              <Link href="/about" className="link-draw text-[10px] text-gray-500 hover:text-black transition-colors">
                Or read our story &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
