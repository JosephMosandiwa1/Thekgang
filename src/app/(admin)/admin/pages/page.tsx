'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import RichTextEditor from '@/components/RichTextEditor';

interface Page { id: number; slug: string; title: string; status: string; updated_at: string; content: any; meta_description: string }

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

export default function PagesAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', meta_description: '', body: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('pages').select('*').order('title');
    setPages((data || []) as Page[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', slug: '', meta_description: '', body: '' });
    setShowForm(true);
  }

  function openEdit(page: Page) {
    setEditing(page);
    setForm({
      title: page.title,
      slug: page.slug,
      meta_description: page.meta_description || '',
      body: contentToHtml(page.content),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !form.title) return;
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const content = form.body;
    const record = { title: form.title, slug, content, meta_description: form.meta_description || null };
    if (editing) {
      await supabase.from('pages').update({ ...record, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('pages').insert({ ...record, status: 'draft' });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function togglePublish(page: Page) {
    if (!supabase) return;
    await supabase.from('pages').update({ status: page.status === 'published' ? 'draft' : 'published', updated_at: new Date().toISOString() }).eq('id', page.id);
    load();
  }

  async function handleDelete(page: Page) {
    if (!supabase || !confirm(`Delete page "${page.title}"? This cannot be undone.`)) return;
    await supabase.from('pages').delete().eq('id', page.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Website Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public website content — create pages, publish, edit</p>
        </div>
        <button onClick={openNew} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors">+ New Page</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total Pages</p><p className="text-2xl font-bold mt-1 text-black">{loading ? '...' : pages.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Published</p><p className="text-2xl font-bold mt-1 text-green-700">{pages.filter(p => p.status === 'published').length}</p></div>
        <div className="border border-gray-200/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Drafts</p><p className="text-2xl font-bold mt-1 text-black">{pages.filter(p => p.status !== 'published').length}</p></div>
      </div>

      <div className="border border-gray-200/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
          <span className="col-span-3">Title</span><span className="col-span-3">Slug</span><span className="col-span-2">Status</span><span className="col-span-2">Updated</span><span className="col-span-2">Actions</span>
        </div>
        {pages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500/70 text-sm">{loading ? 'Loading...' : 'No pages yet — create your first'}</div>
        ) : pages.map(p => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors">
            <span className="col-span-3 text-black font-medium cursor-pointer hover:underline" onClick={() => openEdit(p)}>{p.title}</span>
            <span className="col-span-3 text-gray-500 text-xs font-mono">/{p.slug}</span>
            <span className="col-span-2"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-gray-200/60 text-gray-500'}`}>{p.status}</span></span>
            <span className="col-span-2 text-gray-500 text-xs">{p.updated_at?.split('T')[0]}</span>
            <span className="col-span-2 flex gap-2">
              <button onClick={() => togglePublish(p)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${p.status === 'published' ? 'border-amber-500/30 text-amber-700 hover:bg-amber-50' : 'border-green-500/30 text-green-700 hover:bg-green-50'}`}>
                {p.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => handleDelete(p)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors">Del</button>
            </span>
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-display font-bold text-black mb-4">{editing ? 'Edit Page' : 'New Page'}</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Page title" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="URL slug (auto-generated from title if blank)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black font-mono text-xs" />
                <input value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Meta description" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Content</p>
                  <RichTextEditor
                    value={form.body}
                    onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                    placeholder="Write page content here…"
                    minHeight={360}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleSave} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">{editing ? 'Save Changes' : 'Create Page'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
