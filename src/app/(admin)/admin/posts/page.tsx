'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import RichTextEditor from '@/components/RichTextEditor';
import { FeatureOnSiteButton } from '@/components/placements/FeatureOnSiteButton';

interface Post { id: number; slug: string; title: string; category: string; status: string; published_at: string; created_at: string; content: any; meta_description: string }

function contentToHtml(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((b: any) => {
        const text = (b?.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (b?.type === 'heading') return `<h2>${text}</h2>`;
        if (b?.type === 'quote') return `<blockquote><p>${text}</p></blockquote>`;
        return `<p>${text}</p>`;
      })
      .join('');
  }
  return '';
}

const CATEGORIES = ['News', 'Press Release', 'Announcement', 'Opinion', 'Report', 'Event Recap'];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState({ title: '', category: '', meta_description: '', body: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts((data || []) as Post[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', category: '', meta_description: '', body: '' });
    setShowForm(true);
  }

  function openEdit(post: Post) {
    setEditing(post);
    setForm({
      title: post.title,
      category: post.category || '',
      meta_description: post.meta_description || '',
      body: contentToHtml(post.content),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !form.title) return;
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const content = form.body;
    const record = { title: form.title, slug, category: form.category || null, meta_description: form.meta_description || null, content };

    if (editing) {
      await supabase.from('posts').update(record).eq('id', editing.id);
    } else {
      await supabase.from('posts').insert({ ...record, status: 'draft' });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function togglePublish(post: Post) {
    if (!supabase) return;
    if (post.status === 'published') {
      await supabase.from('posts').update({ status: 'draft', published_at: null }).eq('id', post.id);
    } else {
      await supabase.from('posts').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', post.id);
    }
    load();
  }

  async function handleDelete(post: Post) {
    if (!supabase || !confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    await supabase.from('posts').delete().eq('id', post.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">News &amp; Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Articles, press releases, announcements</p>
        </div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors">+ New Post</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : posts.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Published</p><p className="text-2xl font-bold mt-1 text-green-700">{posts.filter(p => p.status === 'published').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Drafts</p><p className="text-2xl font-bold mt-1 text-black">{posts.filter(p => p.status !== 'published').length}</p></div>
      </div>

      {/* Table */}
      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-4">Title</span><span className="col-span-2">Category</span><span className="col-span-2">Status</span><span className="col-span-2">Published</span><span className="col-span-2">Actions</span>
        </div>
        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No posts yet — write your first article'}</div>
        ) : posts.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-4 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(p)}>{p.title}</span>
            <span className="col-span-2 text-gray-500 text-xs capitalize">{p.category || '—'}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-gray-200/60 text-gray-500'}`}>{p.status}</span></span>
            <span className="col-span-2 text-gray-500 text-xs">{p.published_at?.split('T')[0] || '—'}</span>
            <span className="col-span-2 flex gap-2 items-center">
              <button onClick={() => togglePublish(p)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${p.status === 'published' ? 'border-amber-500/30 text-amber-700 hover:bg-amber-50' : 'border-green-500/30 text-green-700 hover:bg-green-50'}`}>
                {p.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <FeatureOnSiteButton contentKind="post" refId={p.id} contentTitle={p.title} label="Feature" className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-300 text-gray-500 rounded hover:border-black hover:text-black transition-colors" />
              <button onClick={() => handleDelete(p)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
            </span>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Post' : 'New Post'}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Meta description (for SEO and previews)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Body</p>
                  <RichTextEditor
                    value={form.body}
                    onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                    placeholder="Write your article here…"
                    minHeight={320}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">{editing ? 'Save Changes' : 'Create Draft'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
