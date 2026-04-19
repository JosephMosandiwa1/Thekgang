import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type StyleProps, THEME_CLASSES, buildStyle } from './styles-shared';

export function CtaStripStyle({ payload, theme, text_align, ...rest }: StyleProps) {
  return (
    <section className={cn('py-16 px-6', THEME_CLASSES[theme])} style={buildStyle(rest)}>
      <div className={cn('max-w-4xl mx-auto', text_align === 'center' && 'text-center', text_align === 'right' && 'text-right')}>
        {payload.eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 mb-3">{payload.eyebrow}</p>}
        <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">{payload.title}</h2>
        {payload.subtitle && <p className="text-lg opacity-80 mt-4 max-w-2xl" style={text_align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>{payload.subtitle}</p>}
        {payload.body && <p className="text-sm opacity-70 mt-3 max-w-2xl" style={text_align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : undefined}>{payload.body}</p>}
        <div className="mt-8">
          <Link href={payload.cta_url} className="inline-block bg-white text-black border border-current px-8 py-4 text-xs uppercase tracking-wider font-semibold hover:bg-current hover:text-white transition-colors">
            {payload.cta_text} →
          </Link>
        </div>
      </div>
    </section>
  );
}
