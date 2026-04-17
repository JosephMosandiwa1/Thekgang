'use client';

import type { SectionProps } from '../SectionRegistry';

export default function AuthorSection({ event }: SectionProps) {
  const speakers: any[] = Array.isArray(event.speakers) ? event.speakers : [];
  const author = speakers.find(s => s.type === 'author') || speakers[0];
  if (!author) return null;

  return (
    <section id="author" className="py-24 md:py-32 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">The Author</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">About the Author</h2>

        <div className="flex flex-col md:flex-row items-start gap-10">
          {author.photo_url ? (
            <div className="w-[300px] h-[380px] shrink-0 overflow-hidden rounded-lg">
              <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover img-mono" />
            </div>
          ) : (
            <div className="w-[300px] h-[380px] shrink-0 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="font-display text-7xl text-black/10">{(author.name || '?')[0]}</span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-display text-3xl font-bold text-black tracking-tight">{author.name}</h3>
            {author.title && <p className="text-base text-black/50 mt-1">{author.title}</p>}
            {author.bio && <p className="text-base text-black/70 leading-[1.9] mt-5">{author.bio}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
