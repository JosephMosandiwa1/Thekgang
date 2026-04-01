import Link from 'next/link';

/* ============================================================
   Thekgang Homepage — The Welcome
   Speaks to people. Warms them. Orients them. Converts them.
   Literary aesthetic — paper, ink, leather, generous space.
   ============================================================ */

const audiences = [
  { title: 'For Authors', desc: 'You wrote something. We\'ll help you get it from your notebook to a reader\'s hands.', href: '/join', cta: 'Join as Author' },
  { title: 'For Publishers', desc: 'There\'s a market you\'re not serving. We bring you the manuscripts, translators, and evidence.', href: '/join', cta: 'Partner with Us' },
  { title: 'For Schools & Libraries', desc: 'Your learners deserve books in their mother tongue. We\'re building that pipeline.', href: '/programmes', cta: 'See Our Work' },
  { title: 'For the Industry', desc: 'Printers, distributors, booksellers — there\'s work waiting. We connect manuscripts to markets.', href: '/join', cta: 'Join the Network' },
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
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ paddingBottom: '100px' }}>
        {/* Background — typographic hero (no images yet) */}
        <div className="absolute inset-0 bg-ink" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)', backgroundSize: '100% 41px' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Indigenous language greeting — TBC from client */}
          <p className="text-white/30 text-sm tracking-[0.25em] font-display italic mb-6">
            Every story deserves to be told.
          </p>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-[1.2] mb-6">
            The infrastructure for South Africa&apos;s book publishing value chain.
          </h1>

          <p className="text-sm md:text-base text-white/50 max-w-xl mx-auto leading-relaxed mb-4">
            Supporting authors, illustrators, publishers, printers, and distributors across 9 provinces.
            Building pathways for indigenous language books to reach every bookshelf, school, and home.
          </p>

          {/* Founder voice */}
          <p className="text-xs text-white/30 italic max-w-md mx-auto mt-8 mb-10">
            &ldquo;The book you need to read hasn&apos;t been published yet. We&apos;re here to change that.&rdquo;
            <span className="block mt-2 not-italic text-white/20">— Terry-Ann Adams, Founder</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-center">
              <Link href="/join" className="block bg-accent text-white text-xs font-medium tracking-[0.15em] uppercase px-10 py-4 hover:bg-accent-light transition-colors">
                Join the Registry
              </Link>
              <p className="text-[9px] text-white/20 mt-2">Authors, publishers, printers, distributors — be counted</p>
            </div>
            <div className="text-center">
              <Link href="/events" className="block text-white/40 text-xs tracking-[0.15em] uppercase px-6 py-4 hover:text-white/70 transition-colors border border-white/15">
                Upcoming Events
              </Link>
              <p className="text-[9px] text-white/20 mt-2">Workshops, imbizos, and activations</p>
            </div>
          </div>
        </div>

        {/* Bottom: DSAC acknowledgment */}
        <div className="absolute bottom-8 text-center">
          <p className="text-[9px] text-white/15 uppercase tracking-[0.2em]">
            A DSAC Cultural &amp; Creative Industries Cluster
          </p>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="border-l-[3px] border-accent pl-8 py-2">
            <p className="font-display text-2xl md:text-3xl text-ink leading-relaxed tracking-tight">
              South Africa&apos;s book publishing industry generates <span className="text-accent font-bold">R4 billion</span> annually.
              But the vast majority of that value stays in the hands of a few large publishers.
            </p>
            <p className="text-sm text-muted mt-6 max-w-2xl leading-relaxed">
              Indigenous language titles barely reach bookshelves. Authors can&apos;t find publishers.
              Publishers can&apos;t find distributors. Schools can&apos;t find books in their learners&apos; mother tongue.
              The value chain is fragmented — and the people who need it most are left out.
            </p>
            <p className="text-sm text-accent mt-4 font-medium">
              Thekgang exists to connect the dots.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ WHO IS THIS FOR ═══ */}
      <section className="py-20 px-6 bg-warm-gray/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-3">Who is this for</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight mb-12">
            Whether you write, illustrate, publish, print, or distribute — you belong here.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {audiences.map(a => (
              <Link key={a.title} href={a.href}
                className="group block bg-white p-8 border border-sand/50 hover:border-accent/30 hover:shadow-lg transition-all">
                <h3 className="font-display text-lg font-bold text-ink group-hover:text-accent transition-colors mb-3">{a.title}</h3>
                <p className="text-sm text-muted leading-relaxed mb-6">{a.desc}</p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-accent font-medium">{a.cta} &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT WE DO ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-3">Our Programmes</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight mb-4">
            Building capacity across the value chain.
          </h2>
          <p className="text-sm text-muted max-w-2xl mb-10">
            From author workshops to indigenous language book distribution, from industry imbizos to publishing skills programmes — we go where the need is.
          </p>

          <div className="space-y-4">
            {programmes.map(p => (
              <div key={p.name} className="flex items-center justify-between py-4 border-b border-sand/40 last:border-0 group hover:bg-warm-gray/20 -mx-4 px-4 transition-colors">
                <div>
                  <p className="text-base font-medium text-ink group-hover:text-accent transition-colors">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">{p.location}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-3 py-1 border rounded ${
                  p.status === 'Active' ? 'border-green-600/30 text-green-700 bg-green-600/5' : 'border-accent/30 text-accent bg-accent/5'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/programmes" className="text-[11px] uppercase tracking-[0.15em] text-accent font-medium hover:text-accent-light transition-colors">
              See all programmes &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ THE 4 PILLARS ═══ */}
      <section className="py-20 px-6 bg-ink text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-3">Our Strategy</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight mb-12">
            Four pillars. One mission.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { num: '01', title: 'Build Author Capacity', desc: 'Equip South African authors with the skills to write, brand, and market their work — from first draft to published book.' },
              { num: '02', title: 'Transform Consumption', desc: 'Change how local stories are consumed. Indigenous language books belong on every bookshelf, not just in archives.' },
              { num: '03', title: 'Support All Talent', desc: 'Whether it\'s your first manuscript or your tenth — emerging and established creators both deserve infrastructure.' },
              { num: '04', title: 'Grow Markets', desc: 'Innovative distribution that gets books where readers are — rural schools, community libraries, online platforms.' },
            ].map(p => (
              <div key={p.num} className="border-t border-white/10 pt-6">
                <p className="text-accent text-[10px] tracking-[0.2em] uppercase font-semibold mb-2">{p.num}</p>
                <h3 className="font-display text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUNDER ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-display font-bold text-accent mx-auto mb-6">TA</div>
          <p className="font-display text-xl md:text-2xl text-ink leading-relaxed italic">
            &ldquo;I founded Thekgang because I&apos;ve seen the gaps from the inside — as an author published by Jacana Media,
            I know what it takes to get a book from manuscript to reader. Most South African stories never make that journey.
            We&apos;re building the infrastructure so they can.&rdquo;
          </p>
          <p className="text-sm text-accent font-medium mt-6">Terry-Ann Adams</p>
          <p className="text-xs text-muted">Founder &amp; Chairperson, Thekgang NPC</p>
          <p className="text-[10px] text-muted/50 mt-1">Author of <em>Those Who Live In Cages</em> &amp; <em>White Chalk</em> (Jacana Media)</p>
          <p className="text-[10px] text-muted/50">Mail &amp; Guardian 200 Young South Africans 2023</p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 px-6 bg-warm-gray/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight mb-4">
            Be part of the story.
          </h2>
          <p className="text-sm text-muted mb-8">
            Authors, illustrators, translators, publishers, printers, distributors, booksellers, libraries, schools —
            if you&apos;re in the book value chain, we want to know you.
          </p>
          <Link href="/join" className="inline-block bg-accent text-white text-xs font-medium tracking-[0.15em] uppercase px-10 py-4 hover:bg-accent-light transition-colors">
            Join the Registry
          </Link>
        </div>
      </section>
    </div>
  );
}
