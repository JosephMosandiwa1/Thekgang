'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Work {
  id: number;
  title: string;
  work_type: string;
  author_name: string;
  publisher: string | null;
  isbn: string | null;
  first_published_at: string | null;
  public: boolean;
  verified: boolean;
  verification_code: string | null;
  created_at: string;
  members?: { full_name: string; member_number: string | null } | null;
}

export default function AdminCopyright() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unverified' | 'public'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data } = await supabase
      .from('copyright_register')
      .select('id, title, work_type, author_name, publisher, isbn, first_published_at, public, verified, verification_code, created_at, members(full_name, member_number)')
      .order('created_at', { ascending: false });
    setWorks(((data || []) as unknown) as Work[]);
    setLoading(false);
  }

  async function verify(w: Work, verified: boolean) {
    if (!supabase) return;
    await supabase.from('copyright_register').update({ verified }).eq('id', w.id);
    load();
  }

  async function togglePublic(w: Work, pub: boolean) {
    if (!supabase) return;
    await supabase.from('copyright_register').update({ public: pub }).eq('id', w.id);
    load();
  }

  const filtered = works.filter((w) => {
    if (filter === 'unverified') return !w.verified;
    if (filter === 'public') return w.public;
    return true;
  });

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Copyright register</h1>
      <p className="text-sm text-gray-500 mb-8">Registered works · verify metadata · manage public listings</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Total works</p>
          <p className="text-2xl font-bold mt-1">{works.length}</p>
        </div>
        <div className="border border-green-200 bg-green-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Verified</p>
          <p className="text-2xl font-bold mt-1 text-green-700">{works.filter((w) => w.verified).length}</p>
        </div>
        <div className="border border-blue-200 bg-blue-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">Public</p>
          <p className="text-2xl font-bold mt-1 text-blue-700">{works.filter((w) => w.public).length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'unverified', 'public'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${filter === f ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Author</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Member</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">ISBN</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Published</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{w.title}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{w.work_type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-xs">{w.author_name}{w.publisher && <div className="text-[10px] text-gray-500">{w.publisher}</div>}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{w.members?.full_name || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono">{w.isbn || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{w.first_published_at ? formatDate(w.first_published_at, 'short') : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {w.verified && <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5">verified</span>}
                    {w.public && <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5">public</span>}
                    {!w.verified && !w.public && <span className="text-[10px] text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end text-xs">
                    <button onClick={() => verify(w, !w.verified)} className={w.verified ? 'text-gray-500 hover:text-black' : 'text-green-700 hover:underline'}>
                      {w.verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button onClick={() => togglePublic(w, !w.public)} className={w.public ? 'text-gray-500 hover:text-black' : 'text-blue-700 hover:underline'}>
                      {w.public ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">No works match filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
