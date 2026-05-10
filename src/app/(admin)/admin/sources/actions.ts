'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { SourceKind, SourceStatus } from '@/lib/sources/types';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SourceInput {
  slug: string;
  label: string;
  publisher: string;
  url: string | null;
  kind: SourceKind;
  publishedAt: string | null;
  retrievedAt: string | null;
  notes: string | null;
  status: SourceStatus;
}

export async function upsertSource(id: string | null, input: SourceInput, addedBy: string) {
  if (!input.slug || !input.label || !input.publisher) {
    throw new Error('slug, label, and publisher are required');
  }

  const sb = adminClient();
  const row = {
    slug: input.slug.trim(),
    label: input.label.trim(),
    publisher: input.publisher.trim(),
    url: input.url || null,
    kind: input.kind,
    published_at: input.publishedAt || null,
    retrieved_at: input.retrievedAt || null,
    notes: input.notes || null,
    status: input.status,
    added_by: addedBy,
  };

  const query = id
    ? sb.from('sources').update(row).eq('id', id)
    : sb.from('sources').insert(row);

  const { error } = await query;
  if (error) throw error;

  revalidatePath('/admin/sources');
  revalidatePath('/evidence');
}

export async function deleteSource(id: string) {
  const sb = adminClient();
  const { error } = await sb.from('sources').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/sources');
  revalidatePath('/evidence');
}

export async function setSourceStatus(id: string, status: SourceStatus) {
  const sb = adminClient();
  const { error } = await sb.from('sources').update({ status }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/sources');
  revalidatePath('/evidence');
}
