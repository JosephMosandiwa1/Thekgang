'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand, formatRelative } from '@/lib/utils';

interface Job {
  id: number; slug: string | null; title: string; employer_name: string; employer_logo_url: string | null;
  job_type: string; discipline: string | null; location: string | null; remote: boolean;
  salary_min_rands: number | null; salary_max_rands: number | null; salary_period: string;
  closes_at: string | null; posted_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [remote, setRemote] = useState<'all' | 'remote' | 'in_person'>('all');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('jobs').select('*').eq('status', 'open').eq('approved', true).order('posted_at', { ascending: false });
      setJobs(((data || []) as unknown) as Job[]);
      setLoading(false);
    })();
  }, []);

  const filtered = jobs.filter((j) => {
    if (type && j.job_type !== type) return false;
    if (remote === 'remote' && !j.remote) return false;
    if (remote === 'in_person' && j.remote) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return j.title.toLowerCase().includes(needle) || j.employer_name.toLowerCase().includes(needle) || (j.discipline?.toLowerCase().includes(needle) ?? false);
  });

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Jobs</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Publishing jobs.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-8">Sector-specific jobs across the 14 disciplines — from editors and designers to booksellers and literary agents.</p>

        <div className="flex gap-3 mb-6 flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…" className="px-3 py-2 border border-gray-300 text-sm min-w-[240px]" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border border-gray-300 text-sm">
            <option value="">All types</option>
            {['full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={remote} onChange={(e) => setRemote(e.target.value as typeof remote)} className="px-3 py-2 border border-gray-300 text-sm">
            <option value="all">Any location</option><option value="remote">Remote</option><option value="in_person">In-person</option>
          </select>
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading…</p> : filtered.length === 0 ? <p className="text-sm text-gray-500">No jobs match.</p> : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {filtered.map((j) => (
              <Link key={j.id} href={`/jobs/${j.slug || j.id}`} className="block py-5 hover:bg-gray-50 -mx-2 px-2 transition-colors">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display text-lg font-bold">{j.title}</p>
                    <p className="text-sm text-gray-700">{j.employer_name}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="uppercase tracking-wider">{j.job_type.replace(/_/g, ' ')}</span>
                      {j.discipline && <span>· {j.discipline}</span>}
                      {j.location && <span>· {j.location}{j.remote && ' (remote)'}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {j.salary_min_rands && <p className="text-sm font-mono">{formatRand(j.salary_min_rands)}{j.salary_max_rands && ` – ${formatRand(j.salary_max_rands)}`} / {j.salary_period}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{formatRelative(j.posted_at)} · {j.closes_at ? `closes ${formatDate(j.closes_at, 'short')}` : 'open'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Hiring?</h3>
          <p className="text-sm text-gray-600 mb-4">Council members can post job openings. Non-members: contact us to arrange a listing.</p>
          <Link href="/contact?topic=jobs" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">Post a job →</Link>
        </div>
      </div>
    </div>
  );
}
