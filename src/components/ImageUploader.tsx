'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   ImageUploader — drag-drop image upload to Supabase Storage
   ------------------------------------------------------------
   Props:
     value          current image URL (or empty string)
     onChange       called with the new public URL after upload
     folder         storage folder prefix (e.g. 'events', 'speakers', 'homepage')
     label          button label
     aspectClass    tailwind aspect ratio class for preview ('aspect-video', 'aspect-square')
     accept         mime types (default 'image/*')
   ------------------------------------------------------------
   Behaviour:
     - drag-drop or click to pick
     - uploads directly to the 'media' bucket
     - also inserts a record into media_library so the Media
       Library page can browse + delete it later
     - shows live preview of the current value
     - "Remove" clears the value (does NOT delete the storage
       object — deletion happens from the Media Library)
   ============================================================ */

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectClass?: string;
  accept?: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder = 'general',
  label = 'Upload image',
  aspectClass = 'aspect-video',
  accept = 'image/*',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!supabase) {
      setError('Storage not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50 MB).');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const path = `${folder}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // Also register in the media_library index so the library page can show it
      await supabase.from('media_library').insert({
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        folder,
      });

      onChange(publicUrl);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {value ? (
        <div className="border border-gray-200/60 rounded overflow-hidden bg-white">
          <div className={`${aspectClass} w-full bg-gray-50 flex items-center justify-center overflow-hidden`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="px-3 py-2 flex items-center justify-between text-[10px]">
            <span className="text-gray-500 truncate max-w-[70%] font-mono">{value.split('/').pop()}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="uppercase tracking-wider text-gray-500 hover:text-black"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="uppercase tracking-wider text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`${aspectClass} w-full border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50/50'
          }`}
        >
          {uploading ? (
            <p className="text-xs text-gray-500">Uploading…</p>
          ) : (
            <>
              <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-[10px] text-gray-400 mt-1">Drag & drop or click · max 50 MB</p>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
      {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
    </div>
  );
}
