'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   RichTextEditor — Tiptap-based WYSIWYG for Pages, Posts, Events
   ------------------------------------------------------------
   Props:
     value       HTML string (initial content)
     onChange    called with the updated HTML string
     placeholder shown when empty
     minHeight   minimum editor area height
   ------------------------------------------------------------
   Toolbar buttons:
     Bold · Italic · H2 · H3 · Bullet · Numbered · Quote · Link · Image · Clear
   ------------------------------------------------------------
   Image insertion: click the image button → file picker → uploads
   to Supabase Storage 'media' bucket under folder 'editor' → inserts
   <img> tag with the public URL. Same bucket as ImageUploader, so
   images show up in the Media Library page too.
   ============================================================ */

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  minHeight = 300,
}: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // StarterKit in newer tiptap bundles Link — disable so our explicit Link extension is the only one
        link: false,
      } as any),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded my-4 max-w-full' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
      },
    },
  });

  if (!editor) return null;

  function promptLink(ed: Editor) {
    const previous = ed.getAttributes('link').href || '';
    const url = window.prompt('Link URL', previous);
    if (url === null) return;
    if (url === '') {
      ed.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  async function handleImageUpload(file: File) {
    if (!supabase) return;
    const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const path = `editor/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) {
      alert(`Upload failed: ${upErr.message}`);
      return;
    }
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    await supabase.from('media_library').insert({
      name: file.name,
      file_url: data.publicUrl,
      file_type: file.type,
      file_size: file.size,
      folder: 'editor',
    });
    const altText = window.prompt('Alt text for this image (describes the image for accessibility)', file.name) || file.name;
    await supabase.from('media_library').update({ alt_text: altText }).eq('file_url', data.publicUrl);
    editor?.chain().focus().setImage({ src: data.publicUrl, alt: altText }).run();
  }

  const Btn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
        active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200/60 rounded overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 border-b border-gray-200/60 px-2 py-1.5 flex-wrap">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </Btn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </Btn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <Btn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bulleted list"
        >
          • List
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          1. List
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          ❝ Quote
        </Btn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <Btn onClick={() => promptLink(editor)} active={editor.isActive('link')} title="Insert link">
          Link
        </Btn>
        <Btn onClick={() => imgInputRef.current?.click()} title="Insert image">
          Image
        </Btn>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <Btn
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          Clear
        </Btn>
      </div>

      <div style={{ minHeight: `${minHeight}px` }} className="cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
