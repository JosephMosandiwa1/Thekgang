'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const statusColors: Record<string, string> = { planning: 'border-amber-500/30 text-amber-700', active: 'border-green-500/30 text-green-700', completed: 'border-blue-500/30 text-blue-600', reported: 'border-ink/20 text-black/60', cancelled: 'border-red-500/30 text-red-600' };

interface Programme { id: number; name: string; description: string; province: string; status: string; start_date: string; budget_allocated: number; budget_spent: number }

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

  const fmt = (n: number) => `R ${(n || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
  const totalBudget = programmes.reduce((s, p) => s + (p.budget_allocated || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Programmes</h1>
          <p className="text-sm text-gray-500 mt-1">Plan, deliver, track, and report on all programmes</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ New Programme</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Programmes</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : programmes.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Active</p><p className="text-2xl font-bold mt-1 text-green-700">{programmes.filter(p => p.status === 'active').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Budget</p><p className="text-2xl font-bold mt-1 text-black">{fmt(totalBudget)}</p></div>
      </div>

      <div className="space-y-4">
        {programmes.length === 0 ? (
          <div className="border border-gray-200/60 rounded px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No programmes — run the migration to seed data'}</div>
        ) : programmes.map(p => (
          <div key={p.id} className="border border-gray-200/60 rounded p-6 hover:border-black/20 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-black">{p.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                {p.province && <p className="text-[10px] text-black mt-2">{p.province}</p>}
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${statusColors[p.status] || statusColors.planning}`}>{p.status}</span>
            </div>
            {p.budget_allocated > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Budget: {fmt(p.budget_allocated)}</span>
                  <span className="text-black">{fmt(p.budget_spent)} spent ({p.budget_allocated > 0 ? Math.round((p.budget_spent / p.budget_allocated) * 100) : 0}%)</span>
                </div>
                <div className="h-1.5 bg-sand/40 rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: `${p.budget_allocated > 0 ? Math.min(100, (p.budget_spent / p.budget_allocated) * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
