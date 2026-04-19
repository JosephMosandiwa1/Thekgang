import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import { formatRand } from '@/lib/utils';

export const revalidate = 600;

interface Award { id: number; slug: string; name: string; description: string | null; category: string | null; prize_amount_rands: number | null; frequency: string }
interface Cycle { id: number; award_id: number; year: number; nominations_open: string | null; nominations_close: string | null; winner_announced: string | null; status: string }
interface Nom { id: number; cycle_id: number; nominee_name: string; nominated_title: string | null; status: string }

export default async function AwardsPage() {
  const sb = getSupabase();
  let awards: Award[] = [], cycles: Cycle[] = [], winners: Nom[] = [];
  if (sb) {
    const [a, c, w] = await Promise.all([
      sb.from('awards').select('*').eq('active', true).order('name'),
      sb.from('award_cycles').select('*').order('year', { ascending: false }),
      sb.from('award_nominations').select('id, cycle_id, nominee_name, nominated_title, status').in('status', ['winner', 'runner_up']).order('created_at', { ascending: false }).limit(50),
    ]);
    awards = (a.data || []) as Award[];
    cycles = (c.data || []) as Cycle[];
    winners = (w.data || []) as Nom[];
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Recognition</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Literary awards.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-12">Council-administered awards recognising excellence across the 14 publishing disciplines.</p>

        {awards.map((a) => {
          const awardCycles = cycles.filter((c) => c.award_id === a.id);
          const current = awardCycles.find((c) => ['nominations', 'judging', 'shortlisted'].includes(c.status));
          const recent = awardCycles.filter((c) => c.status === 'announced').slice(0, 3);
          return (
            <section key={a.id} className="mb-12 border-b border-gray-200 pb-10">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{a.category} · {a.frequency}</p>
              <h2 className="font-display text-2xl font-bold">{a.name}</h2>
              {a.description && <p className="text-sm text-gray-700 mt-2 mb-4 max-w-2xl">{a.description}</p>}
              {a.prize_amount_rands && <p className="text-sm font-mono">Prize: <strong>{formatRand(a.prize_amount_rands)}</strong></p>}

              {current && (
                <div className="border border-black p-4 mt-4 bg-gray-50">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{current.year} cycle · {current.status}</p>
                  {current.nominations_close && <p className="text-sm">Nominations close: {new Date(current.nominations_close).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                </div>
              )}

              {recent.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Recent winners</p>
                  {recent.map((c) => {
                    const winnerRows = winners.filter((w) => w.cycle_id === c.id);
                    return (
                      <div key={c.id} className="py-2 border-t border-gray-200">
                        <p className="text-sm font-medium">{c.year}</p>
                        {winnerRows.map((w) => <p key={w.id} className="text-sm text-gray-700">{w.nominee_name}{w.nominated_title && ` — ${w.nominated_title}`} {w.status === 'runner_up' && <span className="text-xs text-gray-500">(runner-up)</span>}</p>)}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {awards.length === 0 && <p className="text-sm text-gray-500">Awards programme launching soon.</p>}
      </div>
    </div>
  );
}
