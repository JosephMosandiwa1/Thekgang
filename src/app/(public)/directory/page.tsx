import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Directory',
  description: 'Browse registered members of the Books and Publishing Content Developers and Creators Council — authors, publishers, illustrators, translators, and more.',
};

const TYPE_LABELS: Record<string, string> = {
  author: 'Authors', illustrator: 'Illustrators', translator: 'Translators',
  publisher: 'Publishers', printer: 'Printers', distributor: 'Distributors',
  bookseller: 'Booksellers', library: 'Libraries', school: 'Schools',
  literary_agent: 'Literary Agents', editor: 'Editors', designer: 'Designers',
  journalist: 'Journalists', other: 'Other',
};

interface Member { id: string; name: string; organisation: string | null; province: string | null; constituency_type: string }

export default async function DirectoryPage() {
  const sb = getSupabase();
  let members: Member[] = [];
  if (sb) {
    const { data } = await sb
      .from('constituency_submissions')
      .select('id, name, organisation, province, constituency_type')
      .eq('status', 'verified')
      .order('name');
    members = (data || []) as Member[];
  }

  const byType: Record<string, Member[]> = {};
  for (const m of members) {
    const key = m.constituency_type || 'other';
    (byType[key] ??= []).push(m);
  }
  const types = Object.entries(byType).sort(([, a], [, b]) => b.length - a.length);

  return (
    <div>
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Directory</p>
          <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 64px)' }}>Our people.</h1>
          <p className="text-sm text-gray-500 max-w-xl mt-6 leading-relaxed">
            Registered members of the Books & Publishing Content Developers and Creators Council across all 14 constituency types.
            <Link href="/join" className="link-draw text-black inline-block ml-1">Join the council →</Link>
          </p>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {members.length === 0 ? (
            <div className="border border-gray-200 rounded p-12 text-center bg-white">
              <p className="text-gray-500 mb-2">No verified members in the directory yet.</p>
              <p className="text-xs text-gray-400">Members appear here once their constituency submission is verified by the CDCC secretariat.</p>
              <Link href="/join" className="link-draw text-xs text-black inline-block mt-4">Register as a member →</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                <div className="border border-gray-200 rounded p-4 text-center bg-white">
                  <p className="text-2xl font-display font-bold text-black">{members.length}</p>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider">Total Members</p>
                </div>
                <div className="border border-gray-200 rounded p-4 text-center bg-white">
                  <p className="text-2xl font-display font-bold text-black">{types.length}</p>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider">Constituency Types</p>
                </div>
                <div className="border border-gray-200 rounded p-4 text-center bg-white">
                  <p className="text-2xl font-display font-bold text-black">{new Set(members.map(m => m.province).filter(Boolean)).size}</p>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider">Provinces</p>
                </div>
                <div className="border border-black/20 rounded p-4 text-center bg-black/5">
                  <p className="text-2xl font-display font-bold text-gray-500">{members.filter(m => m.organisation).length}</p>
                  <p className="text-[9px] uppercase text-gray-500 tracking-wider">With Organisations</p>
                </div>
              </div>

              {types.map(([type, typeMembers]) => (
                <div key={type} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-lg font-bold text-black">{TYPE_LABELS[type] || type}</h2>
                    <span className="text-[10px] text-gray-400 font-mono">{typeMembers.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {typeMembers.map(m => (
                      <div key={m.id} className="border border-gray-200/60 rounded p-4 bg-white">
                        <p className="text-sm font-medium text-black">{m.name}</p>
                        {m.organisation && <p className="text-xs text-gray-500 mt-0.5">{m.organisation}</p>}
                        {m.province && <p className="text-[10px] text-gray-400 mt-1">{m.province}</p>}
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
