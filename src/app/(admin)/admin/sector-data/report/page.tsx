'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatRand } from '@/lib/utils';
import { generateSectorReport, type SectorReport } from '@/lib/sectorReport';

interface Period { id: number; period_label: string; year: number; status: string }

export default function AdminSectorReport() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);
  const [report, setReport] = useState<SectorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('sector_data_periods').select('*').order('year', { ascending: false });
    setPeriods((data || []) as Period[]);
    setLoading(false);
  }

  async function generate(id: number) {
    if (!supabase) return;
    setBusy(true);
    setActivePeriod(id);
    const r = await generateSectorReport(supabase, id);
    setReport(r);
    setBusy(false);
  }

  async function publish(id: number, url: string) {
    if (!supabase) return;
    await supabase.from('sector_data_periods').update({ public_report_url: url }).eq('id', id);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Annual Sector Report</h1>
      <p className="text-sm text-gray-500 mb-8">Aggregated from verified discipline submissions · generate draft · publish</p>

      <div className="flex gap-2 flex-wrap mb-8">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => generate(p.id)}
            className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${activePeriod === p.id ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
          >
            {p.period_label}
          </button>
        ))}
        {periods.length === 0 && <p className="text-sm text-gray-500">No periods defined.</p>}
      </div>

      {busy && <p className="text-sm text-gray-500">Generating…</p>}

      {report && !busy && (
        <div>
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-1">{report.period_label} · {report.year}</p>
              <h2 className="font-display text-3xl font-bold">State of the publishing sector</h2>
              <p className="text-sm text-gray-500 mt-1">Generated {new Date(report.generated_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => publish(report.period_id, '/sector-report')} className="text-xs uppercase tracking-wider border border-black px-4 py-2 hover:bg-black hover:text-white">Publish</button>
              <button onClick={() => window.print()} className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">Print / PDF</button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-10">
            <Stat label="Submissions (verified)" value={`${report.totals.submissions_verified} / ${report.totals.submissions_total}`} />
            <Stat label="Titles published" value={report.totals.titles_published.toLocaleString()} />
            <Stat label="Revenue aggregated" value={formatRand(report.totals.revenue_rands)} />
            <Stat label="Employment FTE" value={report.totals.employees_fte.toLocaleString()} />
          </div>

          <section className="mb-10">
            <h3 className="font-display text-lg font-bold mb-4">Disciplines</h3>
            <div className="border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Discipline</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Submissions</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Titles</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Revenue</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">FTE</th>
                  </tr>
                </thead>
                <tbody>
                  {report.disciplines.map((d) => (
                    <tr key={d.discipline} className="border-b border-gray-100">
                      <td className="px-4 py-3">{d.discipline}</td>
                      <td className="px-4 py-3 text-right">{d.submissions}</td>
                      <td className="px-4 py-3 text-right">{d.titles.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatRand(d.revenue)}</td>
                      <td className="px-4 py-3 text-right">{d.employees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="font-display text-lg font-bold mb-4">Provinces</h3>
            <div className="grid grid-cols-3 gap-3">
              {report.provinces.map((p) => (
                <div key={p.province} className="border border-gray-200 p-3 text-sm flex justify-between">
                  <span className="text-gray-700">{p.province}</span>
                  <span className="font-mono">{p.submissions}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-6">
            <QualBlock title="Top challenges" items={report.qualitative.top_challenges} />
            <QualBlock title="Policy priorities" items={report.qualitative.top_policy_priorities} />
            <QualBlock title="Growth notes" items={report.qualitative.notable_growth_notes} />
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QualBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">— no entries</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((s, i) => (<li key={i} className="pl-3 border-l-2 border-gray-200 text-gray-700">{s}</li>))}
        </ul>
      )}
    </div>
  );
}
