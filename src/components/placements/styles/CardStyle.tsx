import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type StyleProps, THEME_CLASSES, buildStyle } from './styles-shared';

export function CardStyle({ payload, theme, text_align, ...rest }: StyleProps) {
  return (
    <Link
      href={payload.cta_url}
      className={cn('group block border border-gray-200 overflow-hidden hover:border-black transition-colors', THEME_CLASSES[theme])}
      style={buildStyle(rest)}
    >
      {payload.image_url && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payload.image_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
        </div>
      )}
      <div className={cn('p-5', text_align === 'center' && 'text-center')}>
        {payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">{payload.eyebrow}</p>}
        <h3 className="font-display text-lg font-bold leading-tight">{payload.title}</h3>
        {payload.subtitle && <p className="text-sm opacity-70 mt-1">{payload.subtitle}</p>}
        {payload.body && <p className="text-xs opacity-60 mt-2 line-clamp-2">{payload.body}</p>}
        <p className="text-xs mt-3 group-hover:underline">{payload.cta_text} →</p>
      </div>
    </Link>
  );
}

export function CalloutStyle({ payload, theme, text_align, ...rest }: StyleProps) {
  return (
    <div className={cn('border border-black p-6 md:p-8', THEME_CLASSES[theme])} style={buildStyle(rest)}>
      <div className={cn(text_align === 'center' && 'text-center', 'max-w-3xl')}>
        {payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-2">{payload.eyebrow}</p>}
        <h3 className="font-display text-2xl font-bold">{payload.title}</h3>
        {payload.subtitle && <p className="text-sm opacity-80 mt-2">{payload.subtitle}</p>}
        {payload.body && <p className="text-sm opacity-70 mt-3">{payload.body}</p>}
        <Link href={payload.cta_url} className="inline-block mt-5 text-xs uppercase tracking-wider border border-current px-4 py-2 hover:bg-current hover:text-white transition-colors">
          {payload.cta_text} →
        </Link>
      </div>
    </div>
  );
}
