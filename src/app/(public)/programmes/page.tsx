'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Programme { id: number; name: string; description: string; objectives: string; target_audience: string; province: string; status: string; start_date: string; end_date: string }

const statusColors: Record<string, string> = { planning: 'border-gray-300 text-black', active: 'border-green-600/30 text-green-700', completed: 'border-muted/30 text-gray-500' };

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
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold mb-3">Programmes</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">Building capacity across the value chain.</h1>
        <p className="text-sm text-gray-500 max-w-xl mb-12">From author workshops to indigenous language book distribution — we go where the need is, one province at a time.</p>

        {loading ? <p className="text-sm text-gray-500/50 text-center py-12">Loading...</p> : programmes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">Programmes loading soon.</p>
        ) : (
          <div className="space-y-8">
            {programmes.map(p => (
              <div key={p.id} className="border border-gray-200/50 rounded p-8 bg-white hover:border-black/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-black">{p.name}</h3>
                    {p.province && <p className="text-xs text-black mt-1">{p.province}</p>}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-3 py-1 border rounded flex-shrink-0 ${statusColors[p.status] || statusColors.planning}`}>{p.status}</span>
                </div>
                {p.description && <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.description}</p>}
                {p.objectives && <div className="text-xs text-gray-500/70"><strong className="text-black/60">Objectives:</strong> {p.objectives}</div>}
                {p.target_audience && <div className="text-xs text-gray-500/70 mt-1"><strong className="text-black/60">For:</strong> {p.target_audience}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
