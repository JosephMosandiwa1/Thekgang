'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatRand } from '@/lib/utils';
import { generateSectorReport, type SectorReport } from '@/lib/sectorReport';

interface Period { id: number; period_label: string; year: number; public_report_url: string | null; status: string }

export default function PublicSectorReportPage() {
  const [report, setReport] = useState<SectorReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: periods } = await supabase
        .from('sector_data_periods')
        .select('*')
        .not('public_report_url', 'is', null)
        .order('year', { ascending: false })
        .limit(1);
      const p = (periods?.[0] || null) as Period | null;
      if (p) {
        const r = await generateSectorReport(supabase, p.id);
        setReport(r);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Annual report</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05] mb-6" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
          State of the publishing sector
        </h1>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && !report && (
          <div className="border border-gray-200 p-8 bg-gray-50">
            <p className="text-sm text-gray-600">The next sector report is in production. <Link href="/portal/sector-data" className="underline">Contribute your data →</Link></p>
          </div>
        )}

        {report && (
          <div>
            <p className="text-gray-600 mb-10 max-w-2xl">
              {report.period_label} · aggregated from {report.totals.submissions_verified} verified discipline submissions representing all 14 publishing disciplines across nine provinces.
            </p>

            <div className="grid md:grid-cols-4 gap-4 mb-12">
              <Stat label="Titles published" value={report.totals.titles_published.toLocaleString()} />
              <Stat label="Sector revenue" value={formatRand(report.totals.revenue_rands)} />
              <Stat label="Employment (FTE)" value={report.totals.employees_fte.toLocaleString()} />
              <Stat label="Freelancers engaged" value={report.totals.freelancers_count.toLocaleString()} />
            </div>

            <section className="mb-12">
              <h2 className="font-display text-xl font-bold mb-4">Discipline snapshot</h2>
              <div className="border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Discipline</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Titles</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Revenue</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">FTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.disciplines.filter((d) => d.submissions > 0).map((d) => (
                      <tr key={d.discipline} className="border-b border-gray-100">
                        <td className="px-4 py-3">{d.discipline}</td>
                        <td className="px-4 py-3 text-right">{d.titles.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{formatRand(d.revenue)}</td>
                        <td className="px-4 py-3 text-right">{d.employees}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="font-display text-xl font-bold mb-4">Growth signals</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <Card label="Digital titles" value={report.totals.digital_titles_count.toLocaleString()} />
                <Card label="Audio titles" value={report.totals.audio_titles_count.toLocaleString()} />
                <Card label="Translations" value={report.totals.translations_count.toLocaleString()} />
              </div>
            </section>

            <p className="text-xs text-gray-400 mt-10">
              Report generated {new Date(report.generated_at).toLocaleString()} · sourced from verified submissions in the Council sector data collection · published by CDCC
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">{label}</p>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
