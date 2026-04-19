import type { DisplayPayload } from '@/lib/placements';

export interface StyleProps {
  placement_id: number;
  payload: DisplayPayload;
  theme: 'light' | 'dark' | 'brand' | 'paper' | 'accent';
  background_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  text_align: 'left' | 'center' | 'right';
}

export const THEME_CLASSES: Record<StyleProps['theme'], string> = {
  light: 'bg-white text-black',
  dark: 'bg-black text-white',
  brand: 'bg-gray-900 text-white',
  paper: 'bg-[#F5F0EB] text-black',
  accent: 'bg-gray-100 text-black',
};

export function buildStyle(p: Pick<StyleProps, 'background_color' | 'text_color'>): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (p.background_color) s.backgroundColor = p.background_color;
  if (p.text_color) s.color = p.text_color;
  return s;
}
