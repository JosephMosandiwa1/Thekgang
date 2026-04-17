'use client';

import type { SectionProps } from '../SectionRegistry';

export default function FeaturedBooksSection({ event }: SectionProps) {
  const books: any[] = Array.isArray(event.featured_books) ? event.featured_books : [];
  if (!books.length) return null;

  return (
    <section id="featured_books" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Featured Books</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Featured Books</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book, i) => (
            <div key={i} className="card-hover group">
              {book.cover_url && (
                <div className="aspect-[2/3] rounded-lg overflow-hidden mb-4 bg-gray-100">
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              )}
              <h3 className="font-display text-lg font-semibold text-black">{book.title}</h3>
              {book.author && <p className="text-sm text-black/50 mt-1">{book.author}</p>}
              {book.description && <p className="text-sm text-black/70 leading-relaxed mt-3">{book.description}</p>}
              {book.link && (
                <a href={book.link} target="_blank" rel="noopener" className="inline-block mt-4 btn-ink text-[10px] uppercase tracking-[0.15em] px-5 py-2">
                  Buy Book
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
