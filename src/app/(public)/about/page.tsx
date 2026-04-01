'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface BoardMember { id: string; name: string; role: string; bio: string; photo_url: string }

const pillars = [
  { title: 'Build Author Capacity', desc: 'Equip South African authors with skills to write, brand, and market their work.' },
  { title: 'Transform Consumption', desc: 'Change how local stories are consumed — indigenous languages on every bookshelf.' },
  { title: 'Support All Talent', desc: 'Emerging and established — both deserve infrastructure and opportunity.' },
  { title: 'Grow Markets', desc: 'Innovative distribution that gets books where readers are.' },
];

export default function AboutPage() {
  const [board, setBoard] = useState<BoardMember[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('board_members').select('*').eq('active', true).order('name').then(({ data }) => setBoard((data || []) as BoardMember[]));
  }, []);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold mb-3">Our Story</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight mb-8">The team behind the movement.</h1>

        {/* Founder */}
        <div className="border-l-[3px] border-accent pl-8 mb-16">
          <p className="font-display text-lg md:text-xl text-ink leading-relaxed italic">
            &ldquo;I&apos;ve been in the publishing system as an author. I know what works and what doesn&apos;t.
            Thekgang exists because too many South African stories — especially in indigenous languages —
            never make it from manuscript to reader. We&apos;re building the infrastructure to change that.&rdquo;
          </p>
          <div className="mt-4">
            <p className="text-sm text-accent font-medium">Terry-Ann Adams</p>
            <p className="text-xs text-muted">Founder &amp; Chairperson</p>
            <p className="text-[10px] text-muted/50 mt-1">Author: <em>Those Who Live In Cages</em>, <em>White Chalk</em> (Jacana Media) &middot; M&amp;G 200 Young South Africans 2023</p>
          </div>
        </div>

        {/* What is Thekgang */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">What is Thekgang?</h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Thekgang NPC is the <strong className="text-ink">Book Publishing, Manufacturing &amp; Distribution Cluster</strong> — one of 17 Cultural &amp; Creative Industries (CCI) clusters established by the Department of Sport, Arts and Culture (DSAC) to strengthen South Africa&apos;s creative economy.
          </p>
          <p className="text-sm text-muted leading-relaxed mb-4">
            We are the connective infrastructure for the book publishing value chain — supporting authors, illustrators, translators, publishers, printers, distributors, booksellers, libraries, and schools across 9 provinces.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Our mandate: expand access to book manufacturing and distribution, facilitate capacity-building programmes, promote local literature, and create sustainable work opportunities across the value chain.
          </p>
        </section>

        {/* 4 Pillars */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-ink mb-8">Our strategic pillars.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((p, i) => (
              <div key={p.title} className="border-t-2 border-accent pt-4">
                <p className="text-[10px] text-accent tracking-[0.2em] uppercase font-semibold mb-1">0{i + 1}</p>
                <h3 className="text-base font-bold text-ink mb-2">{p.title}</h3>
                <p className="text-sm text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Board */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold text-ink mb-8">Board of Directors.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {board.map(m => (
              <div key={m.id} className="text-center">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-xl font-display font-bold text-accent mx-auto mb-4">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <p className="text-sm font-semibold text-ink">{m.name}</p>
                <p className="text-xs text-accent">{m.role}</p>
                {m.bio && <p className="text-xs text-muted mt-2 leading-relaxed">{m.bio}</p>}
              </div>
            ))}
            {board.length === 0 && (
              <>
                {[{ name: 'Terry-Ann Adams', role: 'Chairperson & Founder' }, { name: 'Lorraine Sithole', role: 'Treasurer' }, { name: 'Melvin Kaabwe', role: 'Secretary & Spokesperson' }].map(m => (
                  <div key={m.name} className="text-center">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-xl font-display font-bold text-accent mx-auto mb-4">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-sm font-semibold text-ink">{m.name}</p>
                    <p className="text-xs text-accent">{m.role}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* DSAC */}
        <section className="bg-warm-gray/50 p-8 rounded">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">DSAC Mandate</p>
          <p className="text-sm text-ink leading-relaxed">
            Thekgang operates under a Memorandum of Agreement with the Department of Sport, Arts and Culture.
            As one of 17 CCI clusters, we are mandated to map, connect, and strengthen the book publishing sector —
            with a focus on inclusivity, transformation, and indigenous language publishing.
          </p>
          <p className="text-[10px] text-muted/50 mt-4">Thekgang NPC &middot; Non-Profit Company &middot; DSAC CCI Cluster</p>
        </section>
      </div>
    </div>
  );
}
