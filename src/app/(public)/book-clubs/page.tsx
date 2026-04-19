import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';

export const revalidate = 600;

interface Club { id: number; slug: string; name: string; description: string | null; city: string | null; province: string | null; meeting_cadence: string | null; language: string | null; contact_email: string | null; member_count: number }

export default async function BookClubsPage() {
  const sb = getSupabase();
  let clubs: Club[] = [];
  if (sb) {
    const { data } = await sb.from('book_clubs').select('*').eq('public', true).order('member_count', { ascending: false });
    clubs = (data || []) as Club[];
  }

  const byProvince: Record<string, Club[]> = {};
  for (const c of clubs) {
    (byProvince[c.province || 'Unknown'] ??= []).push(c);
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Book clubs</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Read together.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-12">A directory of South African book clubs — in person, online, across 11 languages. Contact the moderator to ask about joining.</p>

        {clubs.length === 0 ? <p className="text-sm text-gray-500">The directory is being populated.</p> :
          Object.entries(byProvince).map(([province, list]) => (
            <section key={province} className="mb-10">
              <h2 className="font-display text-lg font-bold mb-4">{province} <span className="text-xs text-gray-400 font-mono ml-2">{list.length}</span></h2>
              <div className="grid md:grid-cols-2 gap-4">
                {list.map((c) => (
                  <div key={c.id} className="border border-gray-200 p-5">
                    <p className="font-display text-lg font-bold">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.city} · {c.meeting_cadence || 'Ad-hoc'}{c.language && ` · ${c.language}`}</p>
                    {c.description && <p className="text-sm text-gray-700 mt-2">{c.description}</p>}
                    <div className="flex items-center justify-between mt-3">
                      {c.contact_email && <a href={`mailto:${c.contact_email}`} className="text-xs text-black underline">{c.contact_email}</a>}
                      <span className="text-[10px] text-gray-400">{c.member_count} members</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        }

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Running a book club?</h3>
          <p className="text-sm text-gray-600 mb-4">List your club in the Council directory — reach readers in your area.</p>
          <Link href="/contact?topic=book_club" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">List your club →</Link>
        </div>
      </div>
    </div>
  );
}
