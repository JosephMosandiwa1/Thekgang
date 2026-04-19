'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatRand } from '@/lib/utils';

interface Job {
  id: number; title: string; employer_name: string; employer_logo_url: string | null;
  job_type: string; discipline: string | null; location: string | null; remote: boolean;
  salary_min_rands: number | null; salary_max_rands: number | null; salary_period: string;
  description: string | null; requirements: string | null; benefits: string | null;
  application_url: string | null; application_email: string | null;
  closes_at: string | null; posted_at: string; approved: boolean; status: string;
}

export default function JobDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const isNumeric = /^\d+$/.test(slug);
      let res;
      if (!isNumeric) res = await supabase.from('jobs').select('*').eq('slug', slug).maybeSingle();
      else res = await supabase.from('jobs').select('*').eq('id', Number(slug)).maybeSingle();
      setJob(res?.data as Job | null);
      setLoading(false);
      if (res?.data) {
        await supabase.from('jobs').update({ views_count: ((res.data as { views_count?: number }).views_count || 0) + 1 }).eq('id', (res.data as { id: number }).id);
      }
    })();
  }, [slug]);

  if (loading) return <div className="pt-28 px-6 text-center text-sm text-gray-500">Loading…</div>;
  if (!job || !job.approved || job.status !== 'open') return (
    <div className="pt-28 px-6 text-center">
      <p className="text-sm text-gray-500 mb-3">Job no longer open.</p>
      <Link href="/jobs" className="text-sm underline">← All jobs</Link>
    </div>
  );

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/jobs" className="text-xs text-gray-500 hover:text-black">← All jobs</Link>

        <div className="mt-6 mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-1">{job.employer_name}</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.1]" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>{job.title}</h1>
          <div className="flex gap-3 text-sm text-gray-600 mt-3 flex-wrap">
            <span className="uppercase tracking-wider text-xs">{job.job_type.replace(/_/g, ' ')}</span>
            {job.discipline && <span>· {job.discipline}</span>}
            {job.location && <span>· {job.location}{job.remote && ' (remote)'}</span>}
          </div>
          {job.salary_min_rands && <p className="text-sm font-mono mt-2">{formatRand(job.salary_min_rands)}{job.salary_max_rands && ` – ${formatRand(job.salary_max_rands)}`} / {job.salary_period}</p>}
          {job.closes_at && <p className="text-xs text-gray-500 mt-2">Closes {formatDate(job.closes_at, 'long')}</p>}
        </div>

        {job.description && <section className="mb-8"><h2 className="font-display text-lg font-bold mb-2">About the role</h2><p className="whitespace-pre-wrap text-sm">{job.description}</p></section>}
        {job.requirements && <section className="mb-8"><h2 className="font-display text-lg font-bold mb-2">Requirements</h2><p className="whitespace-pre-wrap text-sm">{job.requirements}</p></section>}
        {job.benefits && <section className="mb-8"><h2 className="font-display text-lg font-bold mb-2">Benefits</h2><p className="whitespace-pre-wrap text-sm">{job.benefits}</p></section>}

        <div className="mt-10 border-t border-gray-200 pt-6 flex gap-3 flex-wrap">
          {job.application_url && <a href={job.application_url} target="_blank" rel="noopener" className="bg-black text-white text-xs uppercase tracking-wider px-5 py-3 hover:bg-gray-800">Apply on employer site →</a>}
          {job.application_email && <a href={`mailto:${job.application_email}?subject=Application: ${job.title}`} className="text-xs uppercase tracking-wider border border-black px-5 py-3 hover:bg-black hover:text-white">Email application</a>}
        </div>
      </div>
    </div>
  );
}
