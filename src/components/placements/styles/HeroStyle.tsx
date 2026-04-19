import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type StyleProps, THEME_CLASSES, buildStyle } from './styles-shared';

export function HeroStyle({ payload, theme, text_align, ...rest }: StyleProps) {
  return (
    <section
      className={cn('relative w-full overflow-hidden', THEME_CLASSES[theme])}
      style={buildStyle(rest)}
    >
      {payload.image_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payload.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </>
      )}
      <div className={cn('relative max-w-6xl mx-auto px-6 py-20 md:py-28', text_align === 'center' && 'text-center', text_align === 'right' && 'text-right')}>
        {payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] opacity-70 mb-4">{payload.eyebrow}</p>}
        <h1 className="font-display font-bold tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(32px, 5vw, 72px)' }}>
          {payload.title}
        </h1>
        {payload.subtitle && <p className="text-lg md:text-xl opacity-80 mt-6 max-w-2xl" style={text_align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>{payload.subtitle}</p>}
        {payload.body && <p className="text-sm opacity-70 mt-4 max-w-2xl" style={text_align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>{payload.body}</p>}
        <div className="mt-8">
          <Link href={payload.cta_url} className="inline-block bg-white text-black text-xs uppercase tracking-wider px-6 py-3 hover:bg-gray-200 transition-colors">
            {payload.cta_text} →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FullTakeoverStyle(props: StyleProps) {
  return (
    <section
      className={cn('relative w-full min-h-[70vh] flex items-center', THEME_CLASSES[props.theme])}
      style={buildStyle(props)}
    >
      {props.payload.image_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.payload.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-transparent" />
        </>
      )}
      <div className={cn('relative z-10 max-w-6xl mx-auto px-6 py-20 w-full', props.text_align === 'center' && 'text-center')}>
        {props.payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] opacity-80 mb-6">{props.payload.eyebrow}</p>}
        <h1 className="font-display font-bold tracking-tight leading-[0.95]" style={{ fontSize: 'clamp(42px, 8vw, 120px)' }}>
          {props.payload.title}
        </h1>
        {props.payload.subtitle && <p className="text-xl md:text-2xl opacity-90 mt-8 max-w-3xl" style={props.text_align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>{props.payload.subtitle}</p>}
        <div className="mt-10">
          <Link href={props.payload.cta_url} className="inline-block bg-white text-black text-sm uppercase tracking-wider px-8 py-4 hover:bg-gray-200 transition-colors font-semibold">
            {props.payload.cta_text} →
          </Link>
        </div>
      </div>
    </section>
  );
}
