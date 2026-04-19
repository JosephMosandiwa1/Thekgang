/**
 * Annual Sector Report engine.
 *
 * Aggregates verified submissions from sector_data_submissions across the 14
 * publishing disciplines into a single sector-wide report. Returns structured
 * JSON that renders both as an admin dashboard and as the public sector report
 * page (see /admin/reports/sector-aggregate and /public/sector-report).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CDCC_DISCIPLINES, SA_PROVINCES } from '@/lib/utils';

export interface SectorReportTotals {
  submissions_verified: number;
  submissions_total: number;
  titles_published: number;
  copies_sold: number;
  revenue_rands: number;
  export_revenue_rands: number;
  employees_fte: number;
  freelancers_count: number;
  digital_titles_count: number;
  audio_titles_count: number;
  translations_count: number;
}

export interface DisciplineBreakdown {
  discipline: string;
  submissions: number;
  titles: number;
  revenue: number;
  employees: number;
}

export interface ProvinceBreakdown {
  province: string;
  submissions: number;
}

export interface SectorReport {
  period_id: number;
  period_label: string;
  year: number;
  generated_at: string;
  totals: SectorReportTotals;
  disciplines: DisciplineBreakdown[];
  provinces: ProvinceBreakdown[];
  qualitative: {
    top_challenges: string[];
    top_policy_priorities: string[];
    notable_growth_notes: string[];
  };
}

interface RawSubmission {
  discipline: string;
  status: string;
  titles_published: number | null;
  copies_sold: number | null;
  revenue_rands: number | null;
  export_revenue_rands: number | null;
  employees_fte: number | null;
  freelancers_count: number | null;
  digital_titles_count: number | null;
  audio_titles_count: number | null;
  translations_count: number | null;
  provinces_active: string[] | null;
  growth_notes: string | null;
  challenges_notes: string | null;
  policy_priorities: string | null;
}

export async function generateSectorReport(
  supabase: SupabaseClient,
  periodId: number
): Promise<SectorReport | null> {
  const { data: period } = await supabase
    .from('sector_data_periods')
    .select('id, year, period_label')
    .eq('id', periodId)
    .maybeSingle();
  if (!period) return null;

  const { data: subsData } = await supabase
    .from('sector_data_submissions')
    .select('discipline, status, titles_published, copies_sold, revenue_rands, export_revenue_rands, employees_fte, freelancers_count, digital_titles_count, audio_titles_count, translations_count, provinces_active, growth_notes, challenges_notes, policy_priorities')
    .eq('period_id', periodId);

  const submissions = ((subsData || []) as unknown) as RawSubmission[];
  const verified = submissions.filter((s) => s.status === 'verified');

  // Totals
  const sum = (key: keyof RawSubmission): number =>
    verified.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);

  const totals: SectorReportTotals = {
    submissions_verified: verified.length,
    submissions_total: submissions.length,
    titles_published: sum('titles_published'),
    copies_sold: sum('copies_sold'),
    revenue_rands: sum('revenue_rands'),
    export_revenue_rands: sum('export_revenue_rands'),
    employees_fte: sum('employees_fte'),
    freelancers_count: sum('freelancers_count'),
    digital_titles_count: sum('digital_titles_count'),
    audio_titles_count: sum('audio_titles_count'),
    translations_count: sum('translations_count'),
  };

  // Discipline breakdown
  const disciplines: DisciplineBreakdown[] = CDCC_DISCIPLINES.map((discipline) => {
    const forD = verified.filter((s) => s.discipline === discipline);
    return {
      discipline,
      submissions: forD.length,
      titles: forD.reduce((a, s) => a + (s.titles_published || 0), 0),
      revenue: forD.reduce((a, s) => a + (Number(s.revenue_rands) || 0), 0),
      employees: forD.reduce((a, s) => a + (s.employees_fte || 0), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Province breakdown (flatten provinces_active[] from every submission)
  const provinceCounts: Record<string, number> = {};
  for (const s of verified) {
    for (const p of s.provinces_active || []) {
      provinceCounts[p] = (provinceCounts[p] || 0) + 1;
    }
  }
  const provinces: ProvinceBreakdown[] = SA_PROVINCES.map((province) => ({
    province,
    submissions: provinceCounts[province] || 0,
  })).sort((a, b) => b.submissions - a.submissions);

  // Qualitative — top of each list (dedupe common phrases)
  const top_challenges = uniqueNonEmpty(verified.map((s) => s.challenges_notes).filter(Boolean) as string[]).slice(0, 8);
  const top_policy_priorities = uniqueNonEmpty(verified.map((s) => s.policy_priorities).filter(Boolean) as string[]).slice(0, 8);
  const notable_growth_notes = uniqueNonEmpty(verified.map((s) => s.growth_notes).filter(Boolean) as string[]).slice(0, 8);

  return {
    period_id: (period as { id: number }).id,
    period_label: (period as { period_label: string }).period_label,
    year: (period as { year: number }).year,
    generated_at: new Date().toISOString(),
    totals,
    disciplines,
    provinces,
    qualitative: { top_challenges, top_policy_priorities, notable_growth_notes },
  };
}

function uniqueNonEmpty(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const trimmed = s.trim();
    if (!trimmed || seen.has(trimmed.slice(0, 60))) continue;
    seen.add(trimmed.slice(0, 60));
    out.push(trimmed);
  }
  return out;
}
