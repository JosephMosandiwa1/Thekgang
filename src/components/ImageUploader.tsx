'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { License } from '@/lib/sources/types';
import { LICENSE_LABEL } from '@/lib/sources/types';

/* ============================================================
   ImageUploader — drag-drop upload with REQUIRED provenance
   ------------------------------------------------------------
   The discipline lives in the upload flow: photographer + source
   + license are MANDATORY before the file is committed. The
   media_library row created by the upload carries that provenance,
   so any downstream consumer (SourcedImage, MediaPicker, public
   pages) already has everything it needs.
   ------------------------------------------------------------
   Backwards-compatible contract:
     - `value`        the existing public URL (legacy callers keep working)
     - `onChange`     called with the new public URL after upload
     - `onMediaId`    called in addition with the media_library UUID
                      so new callers can store the FK
   ============================================================ */

const LICENSE_OPTIONS: License[] = ['cc-by', 'all-rights-reserved', 'member-submitted', 'public-domain', 'press-release', 'fair-use'];

interface SourceOption {
  id: string;
  slug: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Optional: callback that also receives the new media_library UUID. */
  onMediaId?: (mediaId: string) => void;
  folder?: string;
  label?: string;
  aspectClass?: string;
  accept?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onMediaId,
  folder = 'general',
  label = 'Upload image',
  aspectClass = 'aspect-video',
  accept = 'image/*',
}: Props) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [meta, setMeta] = useState<{ photographer: string; source_id: string; license: License; alt_text: string; caption: string }>({
    photographer: '',
    source_id: '',
    license: 'all-rights-reserved',
    alt_text: '',
    caption: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('sources')
        .select('id, slug, label')
        .eq('status', 'published')
        .order('label');
      if (!cancelled) setSources((data ?? []) as SourceOption[]);
    })();
    return () => { cancelled = true; };
  }, []);

  function selectFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50 MB).');
      return;
    }
    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMeta((m) => ({ ...m, alt_text: m.alt_text || file.name.replace(/\.[^/.]+$/, '') }));
  }

  async function commitUpload() {
    if (!pendingFile) return;
    if (!meta.photographer.trim()) { setError('Photographer is required.'); return; }
    if (!meta.source_id) { setError('Source is required. Add one at /admin/sources if missing.'); return; }
    if (!meta.license) { setError('License is required.'); return; }
    if (!supabase) { setError('Storage not configured.'); return; }

    setError(null);
    setUploading(true);
    try {
      const safe = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      const path = `${folder}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, pendingFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: pendingFile.type || undefined,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { data: inserted, error: insErr } = await supabase.from('media_library').insert({
        name: pendingFile.name,
        file_url: publicUrl,
        file_type: pendingFile.type,
        file_size: pendingFile.size,
        folder,
        alt_text: meta.alt_text || null,
        photographer: meta.photographer.trim(),
        source_id: meta.source_id,
        license: meta.license,
        caption: meta.caption || null,
      }).select('id').single();
      if (insErr || !inserted) throw insErr || new Error('Failed to register media row');

      onChange(publicUrl);
      onMediaId?.((inserted as { id: string }).id);

      setPendingFile(null);
      setPreviewUrl(null);
      setMeta({ photographer: '', source_id: '', license: 'all-rights-reserved', alt_text: '', caption: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }

  // ─── render: existing value with preview ──────────────────
  if (value && !pendingFile) {
    return (
      <div>
        <div className="border border-gray-200/60 rounded overflow-hidden bg-white">
          <div className={`${aspectClass} w-full bg-gray-50 flex items-center justify-center overflow-hidden`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="px-3 py-2 flex items-center justify-between text-[10px]">
            <span className="text-gray-500 truncate max-w-[70%] font-mono">{value.split('/').pop()}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="uppercase tracking-wider text-gray-500 hover:text-black">Replace</button>
              <button type="button" onClick={() => onChange('')} className="uppercase tracking-wider text-red-500 hover:text-red-700">Remove</button>
            </div>
          </div>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
      </div>
    );
  }

  // ─── render: pending file with provenance form ─────────────
  if (pendingFile && previewUrl) {
    return (
      <div className="border border-gray-200 rounded overflow-hidden bg-white">
        <div className={`${aspectClass} w-full bg-gray-50 flex items-center justify-center overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-3 space-y-2 border-t border-gray-200">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Provenance · all required</p>
          <input
            value={meta.alt_text}
            onChange={(e) => setMeta((m) => ({ ...m, alt_text: e.target.value }))}
            placeholder="Alt text — describe the image for screen readers"
            className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded-sm"
          />
          <input
            value={meta.photographer}
            onChange={(e) => setMeta((m) => ({ ...m, photographer: e.target.value }))}
            placeholder="Photographer / creator *"
            className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded-sm"
          />
          <select
            value={meta.source_id}
            onChange={(e) => setMeta((m) => ({ ...m, source_id: e.target.value }))}
            className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded-sm"
          >
            <option value="">Pick a source * (from /admin/sources)</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.slug} · {s.label}</option>)}
          </select>
          {sources.length === 0 && (
            <p className="text-[10px] text-amber-700">
              No published sources yet. Add one at <a href="/admin/sources" className="underline">/admin/sources</a> first.
            </p>
          )}
          <select
            value={meta.license}
            onChange={(e) => setMeta((m) => ({ ...m, license: e.target.value as License }))}
            className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded-sm"
          >
            {LICENSE_OPTIONS.map((l) => <option key={l} value={l}>{LICENSE_LABEL[l]}</option>)}
          </select>
          <input
            value={meta.caption}
            onChange={(e) => setMeta((m) => ({ ...m, caption: e.target.value }))}
            placeholder="Caption (optional · shown beneath the image)"
            className="w-full border border-gray-200 px-2 py-1.5 text-xs rounded-sm"
          />

          {error && <p className="text-[10px] text-red-600">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={commitUpload}
              disabled={uploading}
              className="bg-black text-white text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm hover:bg-black/90 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload + register'}
            </button>
            <button
              type="button"
              onClick={() => { setPendingFile(null); setPreviewUrl(null); setError(null); }}
              disabled={uploading}
              className="text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-black px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── render: empty drop zone ────────────────────────────
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`${aspectClass} w-full border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50/50'
        }`}
      >
        <svg className="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-[10px] text-gray-400 mt-1">Drag & drop or click · max 50 MB</p>
        <p className="text-[10px] text-gray-400 mt-1">You'll be asked for photographer + source + license</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
      {error && <p className="text-[10px] text-red-500 mt-2">{error}</p>}
    </div>
  );
}
