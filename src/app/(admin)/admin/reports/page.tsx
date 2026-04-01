'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Report { id: number; report_type: string; period: string; submitted: boolean; submitted_at: string; programmes?: { name: string } }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('programme_reports').select('*, programmes(name)').order('created_at', { ascending: false });
    setReports((data || []) as Report[]);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">DSAC Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Quarterly narrative + financial reports for DSAC</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ New Report</button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200/60 rounded p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">Report Templates</h3>
          <div className="space-y-2">
            {['DSAC Quarterly Narrative', 'DSAC Quarterly Financial', 'Annual Programme Report', 'Completion Report'].map(t => (
              <button key={t} className="w-full text-left px-4 py-3 text-sm border border-gray-200/40 rounded hover:bg-gray-100/30 hover:border-black/20 transition-colors">{t}</button>
            ))}
          </div>
        </div>
        <div className="border border-gray-200/60 rounded p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-3">Reporting Schedule</h3>
          <div className="space-y-3">
            {[
              { period: 'Q1 (Apr-Jun)', due: '31 Jul 2026', status: 'upcoming' },
              { period: 'Q2 (Jul-Sep)', due: '31 Oct 2026', status: 'upcoming' },
              { period: 'Q3 (Oct-Dec)', due: '31 Jan 2027', status: 'upcoming' },
              { period: 'Q4 (Jan-Mar)', due: '30 Apr 2027', status: 'upcoming' },
            ].map(r => (
              <div key={r.period} className="flex justify-between items-center py-2 border-b border-gray-200/20 last:border-0">
                <span className="text-sm text-black">{r.period}</span>
                <span className="text-xs text-gray-500">Due: {r.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Programme</span><span className="col-span-2">Type</span><span className="col-span-2">Period</span><span className="col-span-3">Submitted</span><span className="col-span-2">Status</span>
        </div>
        {reports.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No reports submitted yet'}</div>
        ) : reports.map(r => (
          <div key={r.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm">
            <span className="col-span-3 text-black">{(r as any).programmes?.name || '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{r.report_type}</span>
            <span className="col-span-2 text-gray-500 text-xs">{r.period || '—'}</span>
            <span className="col-span-3 text-gray-500 text-xs">{r.submitted_at?.split('T')[0] || 'Not yet'}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${r.submitted ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'}`}>{r.submitted ? 'Submitted' : 'Draft'}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
