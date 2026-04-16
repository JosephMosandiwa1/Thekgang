'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   MediaPicker — modal grid of existing media_library items,
   click to pick the file_url and close.
   Pairs with ImageUploader — use MediaPicker when you want to
   reuse an already-uploaded asset instead of re-uploading.
   ============================================================ */

interface Item {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  folder?: string; // filter by folder if set
  imagesOnly?: boolean;
}

export default function MediaPicker({ open, onClose, onPick, folder, imagesOnly = true }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      let q = supabase.from('media_library').select('*').order('created_at', { ascending: false }).limit(200);
      if (folder) q = q.eq('folder', folder);
      if (imagesOnly) q = q.like('file_type', 'image/%');
      const { data } = await q;
      setItems((data || []) as Item[]);
      setLoading(false);
    })();
  }, [open, folder, imagesOnly]);

  if (!open) return null;

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-[151] flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col pointer-events-auto">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-display font-bold text-black">Pick from Media Library</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Click any image to use it</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-black text-xl leading-none">
              ×
            </button>
          </div>

          <div className="px-6 py-3 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <p className="text-sm text-gray-500/70 text-center py-12">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500/70">
                  {items.length === 0 ? 'No media uploaded yet' : 'No matches'}
                </p>
                <p className="text-[10px] text-gray-400 mt-2">
                  Use an ImageUploader to add your first file, or visit the Media Library.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filtered.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      onPick(i.file_url);
                      onClose();
                    }}
                    className="group border border-gray-200/60 rounded overflow-hidden hover:border-black transition-colors text-left"
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.file_url}
                        alt={i.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 truncate px-2 py-1.5 group-hover:text-black">{i.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
