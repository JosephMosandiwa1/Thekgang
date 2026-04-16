import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Programmes',
  description: "CDCC programmes supporting South Africa's content creation ecosystem.",
};

// Server Component — no 'use client', data fetched on server, zero JS shipped for data loading

interface Programme { id: number; name: string; description: string; objectives: string; target_audience: string; province: string; status: string }

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProgrammesPage() {
  const sb = getSupabase();
  let programmes: Programme[] = [];
  if (sb) {
    const { data } = await sb.from('programmes').select('*').order('created_at', { ascending: false });
    programmes = (data || []) as Programme[];
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 mb-4">Programmes</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>We go where the need is.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">From skills development to copyright advocacy. <Link href="/events" className="link-draw text-black inline-block">See upcoming events &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {programmes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Programmes loading soon — <Link href="/join" className="link-draw text-black">join the council</Link> to be notified.</p>
          ) : programmes.map(p => (
            <div key={p.id} className="group py-8 border-b rule-gold last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-black mb-2">{p.name}</h2>
                  {p.province && <p className="text-xs text-gray-500 mb-3">{p.province}</p>}
                  {p.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.description}</p>}
                  {p.objectives && <p className="text-xs text-gray-500"><strong className="text-black">Objectives:</strong> {p.objectives}</p>}
                  <Link href="/events" className="link-draw text-[10px] text-gray-500 mt-4 inline-block hover:text-black transition-colors">See related events &rarr;</Link>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-3 py-1 border rounded ${p.status === 'active' ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 px-6 bg-paper texture-paper">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-xl font-bold text-black mb-4">Want to participate?</h2>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Council</Link>
            <Link href="/events" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Or browse upcoming events &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
