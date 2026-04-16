'use client';

import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   Media Library — real upload / browse / delete
   ------------------------------------------------------------
   - Drag-drop or click-to-pick upload to Supabase Storage
     bucket 'media' under the currently selected folder.
   - Indexes every upload in the media_library table so
     records can be filtered by folder and shown in a grid.
   - Delete removes BOTH the storage object and the DB row
     so the library stays consistent.
   - Folder tabs: General · Events · Speakers · Sponsors
     · Homepage · Editor · Posts · Pages
   - Copy-URL button on each item for quick reuse when a
     field still takes a URL rather than an uploader.
   ============================================================ */

interface MediaItem {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  folder: string;
}

const FOLDERS = ['all', 'general', 'events', 'speakers', 'sponsors', 'homepage', 'editor', 'posts', 'pages'] as const;

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<(typeof FOLDERS)[number]>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [folder]);

  async function load() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }
    let q = supabase.from('media_library').select('*').order('created_at', { ascending: false }).limit(500);
    if (folder !== 'all') q = q.eq('folder', folder);
    const { data } = await q;
    setItems((data || []) as MediaItem[]);
    setLoading(false);
  }

  async function uploadFiles(files: File[]) {
    if (!supabase) {
      setError('Storage not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });
    const targetFolder = folder === 'all' ? 'general' : folder;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.size > 50 * 1024 * 1024) {
          setError(`"${file.name}" is larger than 50 MB — skipped.`);
          continue;
        }
        const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
        const path = `${targetFolder}/${Date.now()}-${i}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from('media')
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('media').getPublicUrl(path);
        await supabase.from('media_library').insert({
          name: file.name,
          file_url: data.publicUrl,
          file_type: file.type,
          file_size: file.size,
          folder: targetFolder,
        });
      } catch (e: any) {
        setError(`"${file.name}" — ${e?.message || 'upload failed'}`);
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    setUploading(false);
    setUploadProgress(null);
    load();
  }

  async function handleDelete(item: MediaItem) {
    if (!supabase) return;
    if (!confirm(`Delete "${item.name}" permanently?`)) return;
    // Extract storage path from the public URL: /storage/v1/object/public/media/<path>
    try {
      const marker = '/media/';
      const idx = item.file_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = item.file_url.substring(idx + marker.length);
        await supabase.storage.from('media').remove([storagePath]);
      }
    } catch {
      /* non-fatal — still remove DB record */
    }
    await supabase.from('media_library').delete().eq('id', item.id);
    load();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) uploadFiles(files);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
    e.target.value = '';
  }

  const fmtSize = (b: number) =>
    b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload images, PDFs, audio. Drag files anywhere on the page, or click upload.
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {uploading
            ? `Uploading ${uploadProgress?.done || 0}/${uploadProgress?.total || 0}…`
            : '+ Upload'}
        </button>
      </div>

      {/* Folder tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {FOLDERS.map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-colors ${
              folder === f ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
      )}

      {/* Drag zone + grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded p-4 min-h-[400px] transition-colors ${
          dragging ? 'border-black bg-gray-50' : 'border-gray-200/60'
        }`}
      >
        {loading ? (
          <p className="text-center py-12 text-sm text-gray-500/70">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-10 h-10 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <p className="text-sm text-gray-500/70">No media in this folder yet</p>
            <p className="text-[10px] text-gray-400 mt-1">Drag files here or click Upload above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="group border border-gray-200/60 rounded overflow-hidden hover:shadow-sm transition-shadow bg-white"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {i.file_type?.startsWith('image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.file_url} alt={i.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-gray-500">
                      {i.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-black truncate" title={i.name}>
                    {i.name}
                  </p>
                  <p className="text-[9px] text-gray-500/70">{i.file_size ? fmtSize(i.file_size) : ''}</p>
                  <div className="flex gap-1 mt-1.5">
                    <button
                      onClick={() => copyUrl(i.file_url)}
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 flex-1"
                      title="Copy URL"
                    >
                      {copied === i.file_url ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-red-500/20 text-red-500 rounded hover:bg-red-50"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,audio/*"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
