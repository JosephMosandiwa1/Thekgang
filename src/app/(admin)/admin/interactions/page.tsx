'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Interaction { id: string; interaction_type: string; date: string; summary: string; follow_up: string; follow_up_date: string; completed: boolean; stakeholders?: { name: string } }

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('interactions').select('*, stakeholders(name)').order('date', { ascending: false }).limit(50);
    setInteractions((data || []) as Interaction[]);
    setLoading(false);
  }

  const typeIcons: Record<string, string> = { meeting: 'M', call: 'C', email: 'E', whatsapp: 'W', event: 'V', note: 'N' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Interactions</h1>
        <p className="text-sm text-muted mt-1">Communication log — meetings, calls, emails, follow-ups</p>
      </div>

      <div className="border border-sand/60 rounded">
        {interactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No interactions logged yet — add them from stakeholder profiles'}</div>
        ) : interactions.map(i => (
          <div key={i.id} className="flex gap-4 px-6 py-4 border-b border-sand/30 last:border-0 hover:bg-warm-gray/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
              {typeIcons[i.interaction_type] || 'N'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{(i as any).stakeholders?.name}</span>
                <span className="text-[10px] text-muted capitalize">{i.interaction_type}</span>
                <span className="text-[10px] text-muted/50">{i.date?.split('T')[0]}</span>
              </div>
              <p className="text-xs text-ink/70 mt-1">{i.summary}</p>
              {i.follow_up && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] ${i.completed ? 'text-green-700' : 'text-amber-700'}`}>{i.completed ? 'Done' : 'Follow-up:'}</span>
                  <span className="text-xs text-muted">{i.follow_up}</span>
                  {i.follow_up_date && <span className="text-[10px] text-muted/50">by {i.follow_up_date}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
