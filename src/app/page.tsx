import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-ink tracking-tight mb-4">
        Thekgang
      </h1>
      <p className="text-sm text-muted max-w-lg mb-2">
        Book Publishing, Manufacturing &amp; Distribution Cluster
      </p>
      <p className="text-xs text-muted/50 max-w-md mb-10">
        Building inclusive infrastructure for South Africa&apos;s book publishing value chain.
        A DSAC Cultural &amp; Creative Industries Cluster.
      </p>
      <div className="flex gap-4">
        <Link href="/admin" className="bg-accent text-white text-xs font-medium tracking-wider px-8 py-3 uppercase hover:bg-accent-light transition-colors rounded">
          Admin Portal
        </Link>
      </div>
      <p className="text-[10px] text-muted/30 mt-16">Thekgang NPC &middot; DSAC Mandated Cluster &middot; Est. 2025</p>
    </div>
  );
}
