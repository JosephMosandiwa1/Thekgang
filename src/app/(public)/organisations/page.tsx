import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Organisations register',
  description: 'Publishing organisations registered with the CDCC — publishers, booksellers, distributors, printers and more.',
};

interface Org {
  id: number; slug: string | null; name: string; org_type: string;
  city: string | null; province: string | null;
  website_url: string | null; description: string | null;
  year_founded: number | null;
  disciplines: string[];
  is_member: boolean; verified: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  publisher: 'Publishers', imprint: 'Imprints', bookseller: 'Booksellers',
  distributor: 'Distributors', printer: 'Printers', design_studio: 'Design studios',
  literary_agency: 'Literary agencies', press: 'University presses', library: 'Libraries',
  academic: 'Academic', association: 'Associations', other: 'Other',
};

export default async function OrganisationsPage() {
  const sb = getSupabase();
  let rows: Org[] = [];
  if (sb) {
    const { data } = await sb.from('organisations').select('*').eq('public', true).order('name');
    rows = (data || []) as Org[];
  }

  const byType: Record<string, Org[]> = {};
  for (const r of rows) {
    (byType[r.org_type] ??= []).push(r);
  }
  const sorted = Object.entries(byType).sort(([, a], [, b]) => b.length - a.length);

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Register</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Publishing organisations.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-10">
          Registered organisations across South Africa&apos;s publishing ecosystem — publishers, booksellers, distributors, printers, libraries, and more.
        </p>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">The register is being populated.</p>
        ) : (
          sorted.map(([type, list]) => (
            <div key={type} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-lg font-bold">{TYPE_LABEL[type] || type}</h2>
                <span className="text-[10px] text-gray-400 font-mono">{list.length}</span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.map((o) => (
                  <div key={o.id} className="border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{o.name}</p>
                      {o.verified && <span className="text-[9px] uppercase bg-green-100 text-green-700 px-1.5 py-0.5">verified</span>}
                    </div>
                    {o.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{o.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-2">{[o.city, o.province].filter(Boolean).join(', ')}</p>
                    {o.website_url && <a href={o.website_url} target="_blank" rel="noopener" className="text-[10px] text-black underline mt-1 inline-block">website →</a>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Not registered?</h3>
          <p className="text-sm text-gray-600 mb-4">Publishing organisations can register for free.</p>
          <Link href="/contact" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">Get in touch →</Link>
        </div>
      </div>
    </div>
  );
}
