'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const folders = ['all', 'governance', 'finance', 'hr', 'programmes', 'marketing', 'dsac', 'legal', 'general'];

interface Doc { id: string; name: string; folder: string; file_url: string; file_type: string; file_size: number; created_at: string }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocs((data || []) as Doc[]);
    setLoading(false);
  }

  const filtered = docs.filter(d => {
    if (activeFolder !== 'all' && d.folder !== activeFolder) return false;
    if (search) return d.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });
  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Contracts, governance docs, DSAC submissions, marketing assets</p>
        </div>
        <button className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-black-light transition-colors">+ Upload</button>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
        {folders.map(f => (
          <button key={f} onClick={() => setActiveFolder(f)} className={`text-xs px-3 py-1.5 capitalize rounded transition-colors ${activeFolder === f ? 'bg-gray-100 text-black border border-gray-300' : 'text-gray-500 border border-gray-200/60'}`}>{f}</button>
        ))}
      </div>

      <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
        className="bg-white border border-gray-200/60 px-4 py-2 text-sm rounded text-black placeholder:text-gray-500/30 focus:outline-none focus:border-black w-full max-w-sm mb-6" />

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-4">Name</span><span className="col-span-2">Folder</span><span className="col-span-2">Type</span><span className="col-span-1">Size</span><span className="col-span-2">Date</span><span className="col-span-1">View</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/50 text-sm">{loading ? 'Loading...' : 'No documents found'}</div>
        ) : filtered.map(d => (
          <div key={d.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-4 text-black font-medium truncate">{d.name}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{d.folder}</span>
            <span className="col-span-2 text-gray-500 text-xs">{d.file_type || '—'}</span>
            <span className="col-span-1 text-gray-500 text-xs">{d.file_size ? fmtSize(d.file_size) : '—'}</span>
            <span className="col-span-2 text-gray-500 text-xs">{d.created_at?.split('T')[0]}</span>
            <span className="col-span-1"><a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-black border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors uppercase tracking-wider">View</a></span>
          </div>
        ))}
      </div>
    </div>
  );
}
