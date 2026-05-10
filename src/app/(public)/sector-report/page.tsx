'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatRand, SA_PROVINCES } from '@/lib/utils';
import { generateSectorReport, type SectorReport } from '@/lib/sectorReport';
import { InfoCard } from '@/components/shared/InfoCard';
import { ProvinceGrid } from '@/components/shared/ProvinceGrid';

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

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <InfoCard
                value={report.totals.titles_published.toLocaleString()}
                label="Titles published"
                source={`${report.period_label} · ${report.totals.submissions_verified} verified submissions`}
                whyHere="The headline output figure across all 14 publishing disciplines."
                context="Aggregated from member-submitted production data — counts every title that reached publication during the reporting period, regardless of format."
                href="/portal/sector-data"
                linkText="Contribute data"
              />
              <InfoCard
                value={formatRand(report.totals.revenue_rands)}
                label="Sector revenue"
                source={`${report.period_label} · verified turnover only`}
                whyHere="Total reported sector revenue — the basis for every advocacy ask we make to government."
                context={`Domestic + export combined. Export portion alone: ${formatRand(report.totals.export_revenue_rands)}.`}
                href="/the-plan"
                linkText="See the plan"
              />
              <InfoCard
                value={report.totals.employees_fte.toLocaleString()}
                label="Employment (FTE)"
                source={`${report.period_label} · full-time equivalents`}
                whyHere="Direct employment figure — does not include freelancer engagement."
                context="Counts permanent staff + contract employees normalised to full-time equivalent. Casual / project-based engagement is captured separately under freelancers."
                href="/programmes"
                linkText="Skills programmes"
              />
              <InfoCard
                value={report.totals.freelancers_count.toLocaleString()}
                label="Freelancers engaged"
                source={`${report.period_label} · individual contractors`}
                whyHere="Captures the gig + freelance economy that conventional employment stats miss."
                context="Includes editors, translators, illustrators, narrators, and proofreaders engaged on a per-title basis."
                href="/join"
                linkText="Register your practice"
              />
            </div>

            {report.provinces && report.provinces.some((p) => p.submissions > 0) && (
              <section className="mb-12">
                <h2 className="font-display text-xl font-bold mb-4">Provincial activity</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Verified submissions reporting activity in each province. A submission can report activity in multiple provinces.
                </p>
                <ProvinceGrid
                  data={Object.fromEntries(
                    report.provinces.map((p) => [p.province, p.submissions]),
                  ) as Partial<Record<(typeof SA_PROVINCES)[number], number>>}
                  unit="submissions"
                />
              </section>
            )}

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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60">{label}</p>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
