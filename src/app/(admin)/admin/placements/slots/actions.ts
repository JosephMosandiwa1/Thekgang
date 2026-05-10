'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type SlotPosition = 'head' | 'before_content' | 'sidebar' | 'between_sections' | 'footer';

export interface SlotInput {
  slug: string;
  name: string;
  description: string | null;
  page_path: string | null;       // null = global
  position: SlotPosition | null;  // null = no canonical anchor (slug-keyed only)
  page_scope: string | null;
  max_concurrent: number;
  default_style: string;
  supports_styles: string[];
  active: boolean;
  order_index: number;
}

export async function upsertSlot(id: number | null, input: SlotInput) {
  if (!input.slug || !input.name) throw new Error('Slug and name are required.');
  if (input.supports_styles.length === 0) throw new Error('Pick at least one supported style.');

  const sb = adminClient();
  const row = {
    slug: input.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    page_path: input.page_path || null,
    position: input.position || null,
    page_scope: input.page_scope || (input.page_path ? input.page_path.replace('/', '') || 'home' : 'global'),
    max_concurrent: input.max_concurrent,
    default_style: input.default_style,
    supports_styles: input.supports_styles,
    active: input.active,
    order_index: input.order_index,
    is_admin_created: id ? undefined : true,
  };

  const query = id
    ? sb.from('placement_slots').update(row).eq('id', id)
    : sb.from('placement_slots').insert(row);

  const { error } = await query;
  if (error) throw error;

  revalidateAll();
}

export async function deleteSlot(id: number) {
  const sb = adminClient();
  const { error } = await sb.from('placement_slots').delete().eq('id', id);
  if (error) throw error;
  revalidateAll();
}

export async function setSlotActive(id: number, active: boolean) {
  const sb = adminClient();
  const { error } = await sb.from('placement_slots').update({ active }).eq('id', id);
  if (error) throw error;
  revalidateAll();
}

function revalidateAll() {
  revalidatePath('/admin/placements');
  revalidatePath('/admin/placements/slots');
  // Public surfaces affected — every marketing page may render new zones.
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/the-plan');
  revalidatePath('/ecosystem');
  revalidatePath('/stakeholders');
  revalidatePath('/advocacy');
  revalidatePath('/sector-report');
  revalidatePath('/events');
  revalidatePath('/programmes');
  revalidatePath('/jobs');
  revalidatePath('/grants');
  revalidatePath('/news');
  revalidatePath('/press');
  revalidatePath('/contact');
}
