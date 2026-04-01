'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Submission { id: string; name: string; email: string; phone: string; province: string; constituency_type: string; organisation: string; status: string; created_at: string; languages: string[] }

const types = ['all', 'author', 'illustrator', 'translator', 'publisher', 'printer', 'distributor', 'bookseller', 'library', 'school', 'editor', 'designer'];

export default function RegistryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('constituency_submissions').select('*').order('created_at', { ascending: false });
    setSubmissions((data || []) as Submission[]);
    setLoading(false);
  }

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.constituency_type !== filter) return false;
    if (search) return s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Constituency Registry</h1>
          <p className="text-sm text-muted mt-1">Authors, publishers, printers, distributors — the book ecosystem</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-sand/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Total Registered</p><p className="text-2xl font-bold mt-1 text-ink">{loading ? '...' : submissions.length}</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Pending Review</p><p className="text-2xl font-bold mt-1 text-amber-700">{submissions.filter(s => s.status === 'new').length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Verified</p><p className="text-2xl font-bold mt-1 text-green-700">{submissions.filter(s => s.status === 'verified').length}</p></div>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`text-[10px] px-2.5 py-1 capitalize rounded transition-colors ${filter === t ? 'bg-accent/10 text-accent border border-accent/30' : 'text-muted border border-sand/60'}`}>{t}</button>
        ))}
      </div>
      <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border border-sand/60 px-4 py-2 text-sm rounded text-ink placeholder:text-muted/30 focus:outline-none focus:border-accent w-full max-w-sm mb-6" />

      <div className="border border-sand/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
          <span className="col-span-3">Name</span><span className="col-span-2">Type</span><span className="col-span-2">Province</span><span className="col-span-2">Languages</span><span className="col-span-1">Email</span><span className="col-span-2">Status</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No registrations yet'}</div>
        ) : filtered.map(s => (
          <div key={s.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors">
            <span className="col-span-3 text-ink font-medium">{s.name}</span>
            <span className="col-span-2 text-muted text-xs capitalize">{s.constituency_type?.replace('_', ' ')}</span>
            <span className="col-span-2 text-muted text-xs">{s.province || '—'}</span>
            <span className="col-span-2 text-muted text-[10px]">{(s.languages || []).join(', ') || '—'}</span>
            <span className="col-span-1 text-muted text-xs truncate">{s.email || '—'}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${s.status === 'verified' ? 'border-green-500/30 text-green-700' : s.status === 'new' ? 'border-amber-500/30 text-amber-700' : 'border-sand/60 text-muted'}`}>{s.status}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
