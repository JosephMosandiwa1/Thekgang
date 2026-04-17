'use client';

import type { SectionProps } from '../SectionRegistry';

export default function BookDetailsSection({ event }: SectionProps) {
  const book = event.book_details;
  if (!book) return null;

  const reviews: any[] = Array.isArray(book.reviews) ? book.reviews : [];
  const links: any[] = Array.isArray(book.purchase_links) ? book.purchase_links : [];

  return (
    <section id="book_details" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">The Book</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">About the Book</h2>

        <div className="flex flex-col md:flex-row gap-12">
          {book.cover_url && (
            <div className="w-full md:w-[300px] shrink-0">
              <img src={book.cover_url} alt={book.title} className="w-full rounded-lg shadow-lg" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-display text-3xl font-bold text-black italic">{book.title}</h3>
            {book.author && <p className="text-lg text-black/60 mt-1">by {book.author}</p>}
            {book.publisher && <p className="text-sm text-black/40 mt-1">Published by {book.publisher}</p>}
            {book.isbn && <p className="text-xs text-black/30 font-mono mt-1">ISBN: {book.isbn}</p>}

            {book.synopsis && <p className="text-base text-black/70 leading-[1.8] mt-6">{book.synopsis}</p>}
            {book.extract && (
              <blockquote className="border-l-2 border-black/20 pl-6 italic text-black/50 mt-6 leading-relaxed">
                {book.extract}
              </blockquote>
            )}

            {reviews.length > 0 && (
              <div className="mt-8 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">Reviews</p>
                {reviews.map((r, i) => (
                  <div key={i} className="border-l border-gray-200 pl-4">
                    <p className="text-sm italic text-black/60">&ldquo;{r.quote}&rdquo;</p>
                    {r.source && <p className="text-xs text-black/30 mt-1">&mdash; {r.source}</p>}
                  </div>
                ))}
              </div>
            )}

            {links.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-8">
                {links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener" className="btn-ink text-[10px] uppercase tracking-[0.15em] px-5 py-2.5">
                    {l.label || 'Buy'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
