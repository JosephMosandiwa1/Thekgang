/**
 * Email component primitives — pure HTML-string functions used by the
 * brand-aligned transactional templates in `templates/`.
 *
 * Why strings (and not React components):
 *   - Email clients can't run a runtime; rendered output must be a single
 *     inlined HTML string with all CSS already collapsed onto each element.
 *   - Tree-shaking the JSX compiler out of the server bundle is not worth
 *     the few extra characters of `${}` interpolation.
 *
 * Why inline styles only:
 *   - Outlook 2016+ strips <style> blocks. Gmail dynamic-rendering
 *     ignores @media at the top level. CSS custom properties are not
 *     widely supported. Inline-only is the lowest common denominator.
 *
 * Tokens mirror `src/app/cdcc-tokens.css`. Hex values verified against
 * the design system at `Thekgang/CDCC Design System (4)/colors_and_type.css`.
 */

// ── Brand tokens ───────────────────────────────────────────────────

export const TOKENS = {
  // Light surface (the default for transactional)
  light: {
    bg:        '#F5F1E6',           // cream
    fg:        '#2B2B2B',           // charcoal
    muted:     '#5A595E',
    subtle:    '#807F76',
    rule:      'rgba(43,43,43,0.15)',
    elevated:  '#FFFFFF',
    inverseBg: '#2B2B2B',
    inverseFg: '#F5F1E6',
    inverseRule: 'rgba(245,241,230,0.18)',
    inverseSubtle: '#9A9485',
  },
  dark: {
    bg:        '#2B2B2B',
    fg:        '#F5F1E6',
    muted:     '#9A9485',
    subtle:    '#7A766C',
    rule:      'rgba(245,241,230,0.15)',
    elevated:  '#3A3A3A',
    inverseBg: '#F5F1E6',
    inverseFg: '#2B2B2B',
    inverseRule: 'rgba(43,43,43,0.18)',
    inverseSubtle: '#5A595E',
  },
} as const;

export const ACCENT = '#C5A15A';            // CDCC gold
export const ACCENT_DEEP = '#A8843E';

export const FONT_STACK =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
export const ACCENT_FONT_STACK =
  '"Playfair Display", Georgia, "Times New Roman", serif';

// ── Province registry · adapted from src/lib/utils.ts SA_PROVINCES ──
// Per-province WhatsApp / contact links can be filled in once the CDCC
// secretariat provides them. Until then the helper falls back to the
// default contact email.

export interface ProvinceContact {
  name: string;
  /** Provincial WhatsApp / chapter group, when stood up. */
  whatsappUrl?: string;
  /** Provincial chapter contact email, when assigned. */
  email?: string;
}

export const PROVINCE_CONTACTS: ProvinceContact[] = [
  { name: 'Eastern Cape' },
  { name: 'Free State' },
  { name: 'Gauteng' },
  { name: 'KwaZulu-Natal' },
  { name: 'Limpopo' },
  { name: 'Mpumalanga' },
  { name: 'North West' },
  { name: 'Northern Cape' },
  { name: 'Western Cape' },
];

export function matchProvinceContact(
  province: string | null | undefined,
): ProvinceContact | null {
  if (!province) return null;
  const lower = province.toLowerCase();
  return PROVINCE_CONTACTS.find((p) => p.name.toLowerCase() === lower) ?? null;
}

// ── Inline SVG primitives ──────────────────────────────────────────

/**
 * The CDCC "C" mark · used as the brand accent in headers + footers.
 * Replaces VACSA's triangle. Outline-only so it sits cleanly on either
 * the cream surface or the charcoal canvas.
 */
export function cdccMark(size: number, color: string = ACCENT): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" style="display:inline-block;vertical-align:middle;"><circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="2.4"/><text x="16" y="22" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="18" fill="${color}">C</text></svg>`;
}

export function whatsappGlyph(size: number, color: string = 'currentColor'): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:middle;"><path d="M3.5 20.5l1.3-4.2A8 8 0 1 1 8 19.7l-4.5.8z"></path><path d="M8.5 9.2c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4l.7 1.6c.1.3.1.5 0 .7l-.4.5c-.1.1-.2.3 0 .6.2.3.6 1 1.3 1.6.9.7 1.6 1 1.9 1.1.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.6.7c.2.1.3.2.4.3 0 .2 0 .9-.3 1.3-.3.4-.9.7-1.5.8-.5.1-1 .2-3.3-.6-2.3-.9-3.7-3.2-3.8-3.4-.1-.1-1-1.2-1-2.4 0-1.2.6-1.7.8-1.9z"></path></svg>`;
}

export function arrowRight(size: number, color: string = 'currentColor'): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" style="display:inline-block;vertical-align:middle;"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>`;
}

// ── Escape ─────────────────────────────────────────────────────────

export function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
