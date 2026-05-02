'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import {
  Bold, Italic, UnderlineIcon, List, ListOrdered,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Undo2, Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarButton = {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  isActive: boolean;
};

export function RichTextEditor({ value, onChange, placeholder = 'Enter text…', minHeight = 110 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Superscript, Subscript],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: `min-height:${minHeight}px`,
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const tools: ToolbarButton[] = [
    { label: 'Bold',        icon: <Bold size={13} />,          action: () => editor.chain().focus().toggleBold().run(),          isActive: editor.isActive('bold') },
    { label: 'Italic',      icon: <Italic size={13} />,        action: () => editor.chain().focus().toggleItalic().run(),        isActive: editor.isActive('italic') },
    { label: 'Underline',   icon: <UnderlineIcon size={13} />, action: () => editor.chain().focus().toggleUnderline().run(),     isActive: editor.isActive('underline') },
    { label: 'Superscript', icon: <SuperscriptIcon size={13} />, action: () => editor.chain().focus().toggleSuperscript().run(), isActive: editor.isActive('superscript') },
    { label: 'Subscript',   icon: <SubscriptIcon size={13} />,   action: () => editor.chain().focus().toggleSubscript().run(),   isActive: editor.isActive('subscript') },
    { label: 'Bullet List', icon: <List size={13} />,          action: () => editor.chain().focus().toggleBulletList().run(),    isActive: editor.isActive('bulletList') },
    { label: 'Ordered List',icon: <ListOrdered size={13} />,   action: () => editor.chain().focus().toggleOrderedList().run(),   isActive: editor.isActive('orderedList') },
  ];

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-editor-toolbar">
        {tools.map(t => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={e => { e.preventDefault(); t.action(); }}
            className={`rich-toolbar-btn${t.isActive ? ' active' : ''}`}
          >
            {t.icon}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          title="Undo"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().undo().run(); }}
          className="rich-toolbar-btn"
          disabled={!editor.can().undo()}
        >
          <Undo2 size={13} />
        </button>
        <button
          type="button"
          title="Redo"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().redo().run(); }}
          className="rich-toolbar-btn"
          disabled={!editor.can().redo()}
        >
          <Redo2 size={13} />
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <EditorContent editor={editor} />
        {editor.isEmpty && (
          <div className="rich-editor-placeholder">{placeholder}</div>
        )}
      </div>

      <style>{`
        .rich-editor-wrapper {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--panel-2);
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .rich-editor-wrapper:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-soft);
        }
        .rich-editor-toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid var(--border-soft);
          background: var(--panel);
          flex-wrap: wrap;
        }
        .rich-toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .rich-toolbar-btn:hover:not(:disabled) {
          background: var(--panel-hover);
          color: var(--text);
        }
        .rich-toolbar-btn.active {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .rich-toolbar-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .rich-editor-content {
          padding: 10px 12px;
          outline: none;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text);
          font-family: var(--font-ui);
        }
        .rich-editor-content p { margin: 0 0 6px; }
        .rich-editor-content p:last-child { margin-bottom: 0; }
        .rich-editor-content strong { font-weight: 700; }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content u { text-decoration: underline; }
        .rich-editor-content sup { font-size: 0.75em; vertical-align: super; }
        .rich-editor-content sub { font-size: 0.75em; vertical-align: sub; }
        .rich-editor-content ul, .rich-editor-content ol {
          margin: 4px 0; padding-left: 20px;
        }
        .rich-editor-content li { margin: 2px 0; }
        .rich-editor-placeholder {
          position: absolute;
          top: 10px;
          left: 12px;
          font-size: 13px;
          color: var(--text-dim);
          pointer-events: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export function isRichTextEmpty(html: string): boolean {
  return !stripHtml(html);
}
