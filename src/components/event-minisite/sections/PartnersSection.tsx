'use client';

import type { SectionProps } from '../SectionRegistry';

type Tier = 'partner' | 'sponsor' | 'supporter';
const TIER_ORDER: Tier[] = ['partner', 'sponsor', 'supporter'];
const TIER_LABELS: Record<Tier, string> = { partner: 'Partners', sponsor: 'Sponsors', supporter: 'Supporters' };

export default function PartnersSection({ event }: SectionProps) {
  const sponsors: any[] = Array.isArray(event.sponsors) ? event.sponsors : [];
  if (!sponsors.length) return null;

  const grouped = TIER_ORDER.reduce((acc, tier) => {
    const items = sponsors.filter(s => (s.tier || s.type || 'sponsor') === tier);
    if (items.length) acc.push({ tier, items });
    return acc;
  }, [] as { tier: Tier; items: any[] }[]);

  // If nothing matched tiers, show all as sponsors
  if (!grouped.length) grouped.push({ tier: 'sponsor', items: sponsors });

  return (
    <section id="partners" className="py-24 md:py-32 px-6" style={{ backgroundColor: '#171717' }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Partners & Sponsors</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-white tracking-tight mb-16 type-grow">Our Partners</h2>

        <div className="space-y-16">
          {grouped.map(({ tier, items }) => (
            <div key={tier}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-6">{TIER_LABELS[tier]}</p>
              <div className={`grid gap-4 ${tier === 'partner' ? 'grid-cols-2 md:grid-cols-3' : tier === 'sponsor' ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-4 md:grid-cols-6'}`}>
                {items.map((s, i) => (
                  tier === 'supporter' ? (
                    <p key={i} className="text-xs text-white/50 text-center py-2">{s.name}</p>
                  ) : (
                    <div key={i} className="bg-white rounded-lg p-6 flex items-center justify-center card-hover aspect-[3/2]">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="max-h-16 max-w-full object-contain" />
                      ) : (
                        <span className="text-sm font-medium text-black/60 text-center">{s.name}</span>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
