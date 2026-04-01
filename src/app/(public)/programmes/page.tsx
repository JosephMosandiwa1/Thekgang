'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Programme { id: number; name: string; description: string; objectives: string; target_audience: string; province: string; status: string }

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('programmes').select('*').order('created_at', { ascending: false });
    setProgrammes((data || []) as Programme[]);
    setLoading(false);
  }

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Programmes</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] type-grow cursor-default" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>We go where the need is.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">From author workshops to indigenous language book distribution. <Link href="/events" className="link-draw text-black inline-block">See upcoming events &rarr;</Link></p>
        </div>
      </section>
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {loading ? <p className="text-sm text-gray-500 text-center py-12">Loading...</p> : programmes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Programmes loading soon — <Link href="/join" className="link-draw text-black">join the registry</Link> to be notified.</p>
          ) : programmes.map(p => (
            <div key={p.id} className="group py-8 border-b border-gray-200 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-bold text-black type-card-title mb-2">{p.name}</h2>
                  {p.province && <p className="text-xs text-gray-500 mb-3">{p.province}</p>}
                  {p.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.description}</p>}
                  {p.objectives && <p className="text-xs text-gray-500"><strong className="text-black">Objectives:</strong> {p.objectives}</p>}
                  <Link href="/events" className="link-draw text-[10px] text-gray-500 mt-4 inline-block hover:text-black transition-colors">See related events &rarr;</Link>
                </div>
                <span className={`badge-bw text-[10px] uppercase tracking-wider px-3 py-1 flex-shrink-0 ${p.status === 'active' ? 'badge-bw-emerald' : 'badge-bw-amber'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 px-6 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-xl font-bold text-black mb-4 type-grow-violet cursor-default">Want to participate?</h2>
          <div className="flex flex-col items-center gap-3">
            <Link href="/join" className="btn-ink text-xs tracking-[0.15em] uppercase px-8 py-3">Join the Registry</Link>
            <Link href="/events" className="link-draw text-xs text-gray-500 hover:text-black transition-colors">Or browse upcoming events &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
