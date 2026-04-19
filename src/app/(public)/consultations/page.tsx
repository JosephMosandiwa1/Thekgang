import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';

export const revalidate = 180;

interface Consult { id: number; slug: string; title: string; subject: string | null; closes_at: string | null; status: string; response_count: number; sign_on_count: number }

export default async function ConsultationsListing() {
  const sb = getSupabase();
  let items: Consult[] = [];
  if (sb) {
    const { data } = await sb.from('consultations').select('id, slug, title, subject, closes_at, status, response_count, sign_on_count').in('status', ['open', 'closed', 'responded']).order('closes_at', { ascending: false, nullsFirst: false });
    items = (data || []) as Consult[];
  }
  const open = items.filter((c) => c.status === 'open');
  const past = items.filter((c) => c.status !== 'open');

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Consultations</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Shape the sector.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-12">The Council runs public consultations on bills, frameworks, and policy that affect publishing. Your response goes into our formal submission to Parliament.</p>

        <section className="mb-14">
          <h2 className="font-display text-xl font-bold mb-6">Open now</h2>
          {open.length === 0 ? <p className="text-sm text-gray-500">No consultations open right now.</p> : (
            <div className="space-y-4">
              {open.map((c) => (
                <Link key={c.id} href={`/consultations/${c.slug}`} className="block border border-gray-200 p-6 hover:border-black transition-colors">
                  {c.subject && <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{c.subject}</p>}
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  {c.closes_at && <p className="text-xs text-gray-500 mt-2">Closes {new Date(c.closes_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                  <p className="text-[10px] text-gray-500 mt-1">{c.response_count} responses · {c.sign_on_count} sign-ons</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-6">Past consultations</h2>
            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {past.map((c) => (
                <Link key={c.id} href={`/consultations/${c.slug}`} className="block py-4 hover:bg-gray-50 -mx-2 px-2">
                  <p className="text-xs text-gray-500">{c.subject || ''} · {c.status}</p>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-[10px] text-gray-500">{c.response_count} responses</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
