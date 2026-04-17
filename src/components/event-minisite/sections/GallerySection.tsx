'use client';

import type { SectionProps } from '../SectionRegistry';

export default function GallerySection({ event }: SectionProps) {
  const images: string[] = Array.isArray(event.gallery_urls) ? event.gallery_urls : [];
  if (!images.length) return null;

  return (
    <section id="gallery" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Gallery</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-12 type-grow">Gallery</h2>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener" className="block break-inside-avoid overflow-hidden rounded-lg group">
              <img src={url} alt={`Gallery image ${i + 1}`} className="w-full object-cover img-mono transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
