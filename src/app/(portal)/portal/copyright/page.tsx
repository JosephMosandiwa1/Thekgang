'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface Work {
  id?: number;
  title: string;
  subtitle: string | null;
  work_type: string;
  format: string[];
  language: string;
  isbn: string | null;
  author_name: string;
  co_authors: string[];
  illustrator_name: string | null;
  translator_name: string | null;
  publisher: string | null;
  first_published_at: string | null;
  rights_held_by: string | null;
  licensing_terms: string | null;
  description: string | null;
  public: boolean;
  verified?: boolean;
  verification_code?: string | null;
  created_at?: string;
}

const EMPTY: Work = {
  title: '',
  subtitle: null,
  work_type: 'book',
  format: ['print'],
  language: 'en',
  isbn: null,
  author_name: '',
  co_authors: [],
  illustrator_name: null,
  translator_name: null,
  publisher: null,
  first_published_at: null,
  rights_held_by: 'author',
  licensing_terms: null,
  description: null,
  public: false,
};

const WORK_TYPES = [
  'book', 'novel', 'anthology', 'children_book', 'poetry', 'academic',
  'translation', 'illustration', 'cover_design', 'typeset_layout',
  'audio_book', 'digital_first', 'other',
];
const FORMATS = ['print', 'ebook', 'audio', 'translation', 'braille'];

export default function PortalCopyright() {
  const [works, setWorks] = useState<Work[]>([]);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Work | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id, full_name').eq('auth_user_id', user.id).maybeSingle();
    if (m) {
      const mem = m as { id: number; full_name: string };
      setMemberId(mem.id);
      setMemberName(mem.full_name);
      const { data: w } = await supabase.from('copyright_register').select('*').eq('member_id', mem.id).order('created_at', { ascending: false });
      setWorks(((w || []) as unknown) as Work[]);
    }
    setLoading(false);
  }

  function openNew() {
    setEditing({ ...EMPTY, author_name: memberName });
    setMessage(null);
  }

  function toggleFormat(fmt: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      format: editing.format.includes(fmt)
        ? editing.format.filter((f) => f !== fmt)
        : [...editing.format, fmt],
    });
  }

  async function save() {
    if (!supabase || !memberId || !editing) return;
    setSaving(true); setMessage(null);
    const record = {
      ...editing,
      member_id: memberId,
      verification_code: editing.verification_code || `CDCC-COPY-${Date.now().toString(36).toUpperCase()}`,
      first_published_at: editing.first_published_at || null,
    };
    const { error } = editing.id
      ? await supabase.from('copyright_register').update(record).eq('id', editing.id)
      : await supabase.from('copyright_register').insert(record);
    if (error) setMessage(supabaseErrorMessage(error));
    else { setEditing(null); load(); }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">IP register</p>
          <h1 className="font-display text-3xl font-bold">Copyright register</h1>
          <p className="text-gray-600 mt-2 max-w-2xl text-sm">
            Register your works with the Council for a lightweight public record of authorship and rights. Not a substitute for statutory registration — supplements it.
          </p>
        </div>
        <button onClick={openNew} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-800">
          + Register a work
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{editing.id ? 'Edit work' : 'Register a work'}</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title *</span>
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Subtitle</span>
                  <input value={editing.subtitle ?? ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Work type</span>
                  <select value={editing.work_type} onChange={(e) => setEditing({ ...editing, work_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    {WORK_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Language</span>
                  <input value={editing.language} onChange={(e) => setEditing({ ...editing, language: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">ISBN</span>
                  <input value={editing.isbn ?? ''} onChange={(e) => setEditing({ ...editing, isbn: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono" />
                </label>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Format</span>
                <div className="flex gap-2 flex-wrap">
                  {FORMATS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleFormat(f)} className={`px-3 py-1.5 text-xs border transition-colors ${editing.format.includes(f) ? 'bg-black text-white border-black' : 'border-gray-300'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Author name</span>
                  <input value={editing.author_name} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Publisher</span>
                  <input value={editing.publisher ?? ''} onChange={(e) => setEditing({ ...editing, publisher: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">First published</span>
                  <input type="date" value={editing.first_published_at ?? ''} onChange={(e) => setEditing({ ...editing, first_published_at: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Rights held by</span>
                  <select value={editing.rights_held_by ?? ''} onChange={(e) => setEditing({ ...editing, rights_held_by: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm">
                    <option value="author">Author</option>
                    <option value="publisher">Publisher</option>
                    <option value="joint">Joint</option>
                    <option value="estate">Estate</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Licensing terms (optional)</span>
                <textarea rows={2} value={editing.licensing_terms ?? ''} onChange={(e) => setEditing({ ...editing, licensing_terms: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Description</span>
                <textarea rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value || null })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={editing.public} onChange={(e) => setEditing({ ...editing, public: e.target.checked })} className="mt-0.5" />
                <span className="text-sm">
                  <strong>Publish to public register.</strong>
                  <span className="block text-xs text-gray-500">Your work will appear on the public Council copyright register.</span>
                </span>
              </label>
              {message && <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving || !editing.title || !editing.author_name} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)} className="text-xs text-gray-500 hover:text-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {works.length === 0 ? (
        <p className="text-sm text-gray-500">No registered works yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {works.map((w) => (
            <div key={w.id} className="border border-gray-200 p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">{w.work_type.replace(/_/g, ' ')}{w.public && ' · public'}{w.verified && ' · verified'}</p>
              <h3 className="font-display text-lg font-bold mb-1">{w.title}</h3>
              {w.subtitle && <p className="text-sm text-gray-500 mb-2">{w.subtitle}</p>}
              <p className="text-xs text-gray-600 mb-1">by {w.author_name}</p>
              {w.publisher && <p className="text-xs text-gray-500 mb-1">Publisher: {w.publisher}</p>}
              {w.first_published_at && <p className="text-xs text-gray-500 mb-1">First published: {formatDate(w.first_published_at, 'long')}</p>}
              {w.isbn && <p className="text-xs text-gray-500 font-mono mb-1">ISBN: {w.isbn}</p>}
              {w.verification_code && <p className="text-[10px] text-gray-400 font-mono mt-2">{w.verification_code}</p>}
              <button onClick={() => setEditing(w)} className="mt-3 text-xs text-gray-500 hover:text-black">Edit →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
