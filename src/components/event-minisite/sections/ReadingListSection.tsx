'use client';

import type { SectionProps } from '../SectionRegistry';

export default function ReadingListSection({ event }: SectionProps) {
  const books: any[] = Array.isArray(event.reading_list) ? event.reading_list : [];
  if (!books.length) return null;

  return (
    <section id="reading_list" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Reading List</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Recommended Reading</h2>

        <div className="space-y-6">
          {books.map((book, i) => (
            <div key={i} className="flex gap-5 bg-white rounded-lg border border-gray-200 p-5 card-hover">
              {book.cover_url && (
                <img src={book.cover_url} alt={book.title} className="w-20 h-28 object-cover rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-lg italic text-black">{book.title}</h3>
                {book.author && <p className="text-sm text-black/50 mt-0.5">{book.author}</p>}
                {book.description && <p className="text-sm text-black/70 leading-relaxed mt-2">{book.description}</p>}
                {book.link && (
                  <a href={book.link} target="_blank" rel="noopener" className="inline-block mt-3 text-[10px] uppercase tracking-[0.15em] link-draw text-black/60 hover:text-black">
                    View Book
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
