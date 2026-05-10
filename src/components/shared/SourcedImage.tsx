import Image from 'next/image';
import type { MediaRef } from '@/lib/sources/types';
import { LICENSE_LABEL, citationHref, formatSourceCitation } from '@/lib/sources/types';

/**
 * SourcedImage · the sanctioned way to render an image on the public
 * site. Every image must carry photographer + source + license — those
 * fields live on `MediaRef` and are required at the type level.
 *
 * There is intentionally NO `noCredit` prop. If you need an image
 * without visible credit (decorative SVG, brand icon), use plain
 * <img>/<Image> and put it in `/public/` — but those aren't part of
 * the editorial content surface this component governs.
 *
 * Renders as a <figure> with the image and a <figcaption> showing:
 *   "Photo · {photographer} / {source.publisher} · {license}"
 */

interface SourcedImageProps {
  media: MediaRef;
  /** Override media.alt if context calls for a different description. */
  alt?: string;
  /** Required for static layout — falls back to fill if both omitted. */
  width?: number;
  height?: number;
  /** Forward to next/image · for above-the-fold images. */
  priority?: boolean;
  /** Wrapper className. */
  className?: string;
  /** Image className. */
  imageClassName?: string;
  /** Hide the visible caption (provenance still rendered as visually-hidden text for screen readers). */
  captionPosition?: 'below' | 'overlay' | 'sr-only';
}

export function SourcedImage({
  media,
  alt,
  width,
  height,
  priority,
  className = '',
  imageClassName = '',
  captionPosition = 'below',
}: SourcedImageProps) {
  const description = alt ?? media.alt ?? media.caption ?? '';
  const credit = `Photo · ${media.photographer} / ${formatSourceCitation(media.source)}`;
  const licenseLabel = LICENSE_LABEL[media.license];

  const useFill = !width || !height;

  return (
    <figure className={`m-0 ${className}`}>
      <div className={useFill ? 'relative w-full h-full' : ''}>
        <Image
          src={media.url}
          alt={description}
          width={useFill ? undefined : width}
          height={useFill ? undefined : height}
          fill={useFill || undefined}
          priority={priority}
          className={imageClassName}
        />
      </div>

      {captionPosition === 'sr-only' && (
        <figcaption className="sr-only">
          {credit} · {licenseLabel}
        </figcaption>
      )}

      {captionPosition === 'below' && (
        <figcaption className="mt-2 text-[10px] tracking-wide text-[var(--fg-3,#5A595E)] flex flex-wrap items-center gap-x-2 gap-y-1">
          {media.caption && <span className="text-[var(--fg-2,#404045)]">{media.caption}</span>}
          {media.caption && <span className="text-[var(--fg-3,#5A595E)]/60">·</span>}
          <span>
            Photo · {media.photographer} /{' '}
            <a
              href={citationHref(media.source)}
              target={media.source.url ? '_blank' : undefined}
              rel={media.source.url ? 'noopener noreferrer' : undefined}
              className="underline decoration-dotted underline-offset-2"
            >
              {media.source.publisher}
              {media.source.url ? ' ↗' : ''}
            </a>
          </span>
          <span className="text-[var(--fg-3,#5A595E)]/60">·</span>
          <span className="uppercase tracking-[0.12em]" style={{ fontSize: 9 }}>
            {licenseLabel}
          </span>
        </figcaption>
      )}

      {captionPosition === 'overlay' && (
        <figcaption className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/60 text-white text-[10px] flex flex-wrap items-center gap-x-2">
          <span>{credit}</span>
          <span className="opacity-60">·</span>
          <span className="uppercase tracking-[0.12em] opacity-80">{licenseLabel}</span>
        </figcaption>
      )}
    </figure>
  );
}
