'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface BoardMember { id: string; name: string; role: string; bio: string; photo_url: string }

export default function AboutPage() {
  const [board, setBoard] = useState<BoardMember[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('board_members').select('*').eq('active', true).order('name').then(({ data }) => setBoard((data || []) as BoardMember[]));
  }, []);

  const boardFallback = [
    { name: 'Terry-Ann Adams', role: 'Chairperson & Founder', bio: 'Award-winning author (Those Who Live In Cages, White Chalk — Jacana Media). M&G 200 Young South Africans 2023. Howard + Central Saint Martins alum.' },
    { name: 'Lorraine Sithole', role: 'Treasurer & Co-founder', bio: '' },
    { name: 'Melvin Kaabwe', role: 'Secretary, Spokesperson & Co-founder', bio: '' },
  ];
  const displayBoard = board.length > 0 ? board : boardFallback.map((m, i) => ({ ...m, id: String(i), photo_url: '' }));

  return (
    <div>
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Our Story</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>
            We didn&apos;t start with a website.<br />We started with a problem.
          </h1>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto border-l-[3px] border-black pl-8">
          <p className="font-display text-xl md:text-2xl text-black leading-relaxed italic">
            &ldquo;I&apos;ve been in the publishing system as an author. I know what works and what doesn&apos;t. Thekgang exists because too many South African stories — especially in indigenous languages — never make it from manuscript to reader.&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-sm font-display font-bold text-black transition-all hover:border-black hover:scale-110">TA</div>
            <div>
              <p className="text-sm text-black font-medium">Terry-Ann Adams</p>
              <p className="text-xs text-gray-500">Founder &amp; Chairperson &middot; Author: <em>Those Who Live In Cages</em>, <em>White Chalk</em></p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">What is Thekgang</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-black tracking-tight mb-8 type-grow-amber cursor-default">The connective infrastructure for South Africa&apos;s book publishing value chain.</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed max-w-2xl">
            <p>Thekgang NPC is the <strong className="text-black">Book Publishing, Manufacturing &amp; Distribution Cluster</strong> — one of 17 CCI clusters established by DSAC.</p>
            <p>We support authors, illustrators, translators, publishers, printers, distributors, booksellers, libraries, and schools across 9 provinces.</p>
          </div>
          <Link href="/programmes" className="link-draw text-xs text-gray-500 mt-6 inline-block hover:text-black transition-colors">See our programmes &rarr;</Link>
        </div>
      </section>

      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Strategic Pillars</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {[
              { num: '01', title: 'Build Author Capacity', desc: 'Equip authors to write, brand, and market their work.' },
              { num: '02', title: 'Transform Consumption', desc: 'Indigenous language books on every bookshelf.' },
              { num: '03', title: 'Support All Talent', desc: 'Emerging and established creators both deserve infrastructure.' },
              { num: '04', title: 'Grow Markets', desc: 'Get books where readers are — schools, libraries, online.' },
            ].map(p => (
              <div key={p.num} className="border-t border-white/15 pt-6">
                <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">{p.num}</p>
                <h3 className="font-display text-xl font-bold text-white mb-3 type-lift transition-all">{p.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/programmes" className="link-draw text-xs text-white/40 mt-10 inline-block hover:text-white/70 transition-colors">See how we deliver on these &rarr;</Link>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Board of Directors</p>
          <h2 className="font-display text-2xl font-bold text-black tracking-tight mb-12 type-grow-violet cursor-default">The people behind the mission.</h2>
          <div className="space-y-10">
            {displayBoard.map(m => (
              <div key={m.id || m.name} className="group flex items-start gap-6 py-6 border-b border-gray-200 last:border-0">
                <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center text-lg font-display font-bold text-black flex-shrink-0 transition-all group-hover:border-black group-hover:scale-105">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-bold text-black type-card-title">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.role}</p>
                  {m.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{m.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-xl font-bold text-black mb-4 type-grow cursor-default">Want to work with us?</h2>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Registry</Link>
            <Link href="/contact" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Or get in touch directly &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
