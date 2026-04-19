import { getSupabase } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const revalidate = 600;

interface Entry { id: number; book_title: string; author: string | null; isbn: string | null; challenge_type: string; institution: string | null; location: string | null; reason_stated: string | null; date_of_event: string | null; council_response: string | null; source_url: string | null }

export default async function BannedBooksPage() {
  const sb = getSupabase();
  let rows: Entry[] = [];
  if (sb) {
    const { data } = await sb.from('banned_books').select('*').eq('public', true).order('date_of_event', { ascending: false, nullsFirst: false });
    rows = (data || []) as Entry[];
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">Freedom to read</p>
        <h1 className="font-display font-bold text-black tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Banned &amp; challenged books.</h1>
        <p className="text-sm text-gray-500 max-w-xl mt-6 mb-10">
          A public record of books banned, restricted, or challenged in South Africa — and the Council&apos;s response. Transparency is a form of protection.
        </p>

        {rows.length === 0 ? <p className="text-sm text-gray-500">No entries recorded.</p> : (
          <div className="space-y-5">
            {rows.map((r) => (
              <div key={r.id} className="border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-display text-lg font-bold">{r.book_title}</p>
                  <span className={`text-[10px] uppercase px-2 py-0.5 ${r.challenge_type === 'reinstated' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.challenge_type}</span>
                </div>
                {r.author && <p className="text-sm text-gray-700">by {r.author}</p>}
                {r.isbn && <p className="text-xs font-mono text-gray-500">{r.isbn}</p>}
                <div className="mt-3 text-xs text-gray-600 space-y-1">
                  {r.institution && <p>Where: <strong>{r.institution}</strong>{r.location && ` · ${r.location}`}</p>}
                  {r.date_of_event && <p>When: {formatDate(r.date_of_event, 'long')}</p>}
                  {r.reason_stated && <p className="mt-2 text-gray-700">Stated reason: {r.reason_stated}</p>}
                </div>
                {r.council_response && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Council response</p>
                    <p className="text-sm text-gray-700">{r.council_response}</p>
                  </div>
                )}
                {r.source_url && <a href={r.source_url} target="_blank" rel="noopener" className="text-[10px] underline text-gray-500 mt-3 inline-block">Source →</a>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-10">
          <h3 className="font-display text-lg font-bold mb-2">Report a banned or challenged book</h3>
          <p className="text-sm text-gray-600 mb-4">If you become aware of a book being banned, restricted, or challenged in South Africa, contact the Council.</p>
          <a href="/contact?topic=banned_book" className="text-xs uppercase tracking-wider border border-black px-5 py-3 inline-block hover:bg-black hover:text-white">Report an incident →</a>
        </div>
      </div>
    </div>
  );
}
