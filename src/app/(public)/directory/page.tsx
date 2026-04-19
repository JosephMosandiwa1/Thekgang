import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Member directory',
  description: 'Browse practitioners enrolled in the Content Development Council — authors, editors, illustrators, publishers, translators and more, across all 14 publishing disciplines.',
};

interface MemberRow {
  id: number;
  full_name: string;
  organisation: string | null;
  province: string | null;
  city: string | null;
  disciplines: string[];
  bio: string | null;
  website_url: string | null;
  member_number: string | null;
}

export default async function DirectoryPage() {
  const sb = getSupabase();
  let members: MemberRow[] = [];
  if (sb) {
    const { data } = await sb
      .from('members')
      .select('id, full_name, organisation, province, city, disciplines, bio, website_url, member_number')
      .eq('consent_directory', true)
      .eq('verified', true)
      .eq('status', 'active')
      .order('full_name');
    members = (data || []) as MemberRow[];
  }

  // Group by primary discipline (first in the array) to show a segmented directory
  const byDiscipline: Record<string, MemberRow[]> = {};
  for (const m of members) {
    const key = m.disciplines[0] || 'Other';
    (byDiscipline[key] ??= []).push(m);
  }
  const sortedDisciplines = Object.entries(byDiscipline).sort(([, a], [, b]) => b.length - a.length);

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Directory</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>Our people.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">
            Verified members of the Council who have opted in to the public directory. Only practitioners with active membership are shown.{' '}
            <Link href="/join" className="text-black underline">Join the Council →</Link>
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {members.length === 0 ? (
            <div className="border border-gray-200 p-12 text-center bg-white">
              <p className="text-gray-500 mb-2">No directory entries yet.</p>
              <p className="text-xs text-gray-400">Practitioners appear here once they enrol, are verified, and opt in to the public directory.</p>
              <Link href="/join" className="text-xs text-black underline inline-block mt-4">Enrol as a member →</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                <StatCard value={members.length} label="Members in directory" />
                <StatCard value={sortedDisciplines.length} label="Disciplines represented" />
                <StatCard value={new Set(members.map((m) => m.province).filter(Boolean)).size} label="Provinces" />
                <StatCard value={members.filter((m) => m.organisation).length} label="With organisations" />
              </div>

              {sortedDisciplines.map(([discipline, list]) => (
                <div key={discipline} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-lg font-bold text-black">{discipline}</h2>
                    <span className="text-[10px] text-gray-400 font-mono">{list.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map((m) => (
                      <div key={m.id} className="border border-gray-200/60 p-4 bg-white">
                        <p className="text-sm font-medium text-black">{m.full_name}</p>
                        {m.organisation && <p className="text-xs text-gray-500 mt-0.5">{m.organisation}</p>}
                        {m.disciplines.length > 1 && (
                          <p className="text-[10px] text-gray-400 mt-1">Also: {m.disciplines.slice(1).join(' · ')}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {m.province && <p className="text-[10px] text-gray-400">{[m.city, m.province].filter(Boolean).join(', ')}</p>}
                          {m.member_number && <p className="text-[10px] font-mono text-gray-400">{m.member_number}</p>}
                        </div>
                        {m.website_url && <a href={m.website_url} target="_blank" rel="noopener" className="text-[10px] text-gray-500 hover:text-black underline mt-1 inline-block">website →</a>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-gray-200 p-4 text-center bg-white">
      <p className="text-2xl font-display font-bold text-black">{value}</p>
      <p className="text-[9px] uppercase text-gray-500 tracking-wider">{label}</p>
    </div>
  );
}
