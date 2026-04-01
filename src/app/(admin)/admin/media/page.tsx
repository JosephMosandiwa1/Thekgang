'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface MediaItem { id: string; name: string; file_url: string; file_type: string; file_size: number; created_at: string }

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('media_library').select('*').order('created_at', { ascending: false });
    setItems((data || []) as MediaItem[]);
    setLoading(false);
  }

  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)}KB` : `${(b/1048576).toFixed(1)}MB`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">Images, PDFs, audio files — upload and manage</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ Upload</button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-gray-200/60 rounded p-16 text-center">
          <p className="text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No media uploaded yet'}</p>
          <p className="text-gray-500/50 text-xs mt-2">Upload images, PDFs, and audio for your website and content</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(i => (
            <div key={i.id} className="border border-gray-200/60 rounded overflow-hidden hover:shadow-sm transition-shadow">
              {i.file_type?.startsWith('image') ? (
                <img src={i.file_url} alt={i.name} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gray-100/30 flex items-center justify-center text-xs text-gray-500">{i.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}</div>
              )}
              <div className="p-2">
                <p className="text-[10px] text-black truncate">{i.name}</p>
                <p className="text-[9px] text-gray-500/70">{i.file_size ? fmtSize(i.file_size) : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
