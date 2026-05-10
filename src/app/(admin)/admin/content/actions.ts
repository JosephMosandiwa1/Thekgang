'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { SourceStatus } from '@/lib/sources/types';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface FactInput {
  surface: string;
  position: number;
  value: string;
  label: string;
  whyHere: string | null;
  context: string | null;
  sourceId: string;
  href: string;
  status: SourceStatus;
  isActive: boolean;
}

export async function upsertFact(id: string | null, input: FactInput) {
  if (!input.surface || !input.value || !input.label) {
    throw new Error('surface, value, and label are required');
  }
  if (!input.sourceId) throw new Error('Every fact must reference a source.');
  if (!input.href) throw new Error('Every fact must carry a doorway href.');

  const sb = adminClient();
  const row = {
    surface: input.surface.trim(),
    position: input.position,
    value: input.value.trim(),
    label: input.label.trim(),
    why_here: input.whyHere || null,
    context: input.context || null,
    source_id: input.sourceId,
    href: input.href.trim(),
    status: input.status,
    is_active: input.isActive,
  };

  const query = id
    ? sb.from('content_facts').update(row).eq('id', id)
    : sb.from('content_facts').insert(row);

  const { error } = await query;
  if (error) throw error;

  revalidatePath('/admin/content');
  // Revalidate every public surface that might display this fact.
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/the-plan');
  revalidatePath('/ecosystem');
  revalidatePath('/stakeholders');
  revalidatePath('/advocacy');
  revalidatePath('/sector-report');
}

export async function deleteFact(id: string) {
  const sb = adminClient();
  const { error } = await sb.from('content_facts').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/content');
}

export async function setFactStatus(id: string, status: SourceStatus) {
  const sb = adminClient();
  const { error } = await sb.from('content_facts').update({ status }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/content');
}
