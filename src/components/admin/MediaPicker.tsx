'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { License } from '@/lib/sources/types';

/**
 * MediaPicker · admin component for selecting an image from
 * `media_library` by its UUID. Only shows entries that already carry
 * full provenance (photographer + source_id + license) — sourceless
 * legacy rows are filtered out so they cannot be reused on new
 * surfaces.
 *
 * Pair with the extended ImageUploader for fresh uploads. The picker
 * returns the media_library `id` (uuid), which downstream code stores
 * as `*_media_id` on the parent row (e.g. events.cover_media_id).
 */

interface MediaRow {
  id: string;
  file_url: string;
  alt_text: string | null;
  photographer: string | null;
  source_id: string | null;
  license: License | null;
  caption: string | null;
  folder: string | null;
}

interface MediaPickerProps {
  value: string | null;
  onChange: (mediaId: string | null) => void;
  /** Optional folder filter (e.g. 'events'). */
  folder?: string;
  label?: string;
}

export function MediaPicker({ value, onChange, folder, label = 'Pick an image' }: MediaPickerProps) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      let query = supabase
        .from('media_library')
        .select('id, file_url, alt_text, photographer, source_id, license, caption, folder')
        .not('source_id', 'is', null)
        .not('photographer', 'is', null)
        .not('license', 'is', null)
        .order('created_at', { ascending: false })
        .limit(120);
      if (folder) query = query.eq('folder', folder);
      const { data } = await query;
      if (!cancelled) {
        setItems((data ?? []) as MediaRow[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [folder]);

  const selected = items.find((i) => i.id === value);
  const filtered = search
    ? items.filter((i) =>
        (i.alt_text ?? '').toLowerCase().includes(search.toLowerCase())
        || (i.photographer ?? '').toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="border border-gray-200 rounded-sm bg-white">
      {selected ? (
        <div className="p-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.file_url} alt="" className="w-20 h-20 object-cover rounded-sm" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-medium truncate">{selected.alt_text || selected.file_url.split('/').pop()}</p>
            <p className="text-gray-500 text-[10px]">Photo · {selected.photographer}</p>
            <p className="text-gray-500 text-[10px]">{selected.license}</p>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setOpen(true)} className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-black">
                Change
              </button>
              <button type="button" onClick={() => onChange(null)} className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-4 py-3 text-xs text-gray-600 hover:text-black hover:bg-gray-50 text-left"
        >
          {label} →
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setOpen(false)}>
          <div className="bg-white max-w-3xl w-full max-h-[80vh] overflow-hidden rounded-sm flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Pick an image</p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alt text or photographer…"
                className="flex-1 border border-gray-200 px-3 py-1 text-xs rounded-sm"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-black">
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-3 md:grid-cols-4 gap-3">
              {loading && <p className="col-span-full text-xs text-gray-500">Loading…</p>}
              {!loading && filtered.length === 0 && (
                <p className="col-span-full text-xs text-gray-500">
                  No provenance-rich images in this library yet. Upload one — the uploader requires
                  photographer + source + license at creation time.
                </p>
              )}
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onChange(m.id); setOpen(false); }}
                  className="border border-gray-200 hover:border-black rounded-sm overflow-hidden text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.file_url} alt="" className="w-full aspect-square object-cover" />
                  <p className="text-[10px] text-gray-600 px-2 py-1 truncate">{m.photographer}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
