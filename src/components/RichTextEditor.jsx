import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { useRef } from 'react'
import { uploadImage } from '../api/client'
import './RichTextEditor.css'

function MenuBar({ editor, onImageUpload }) {
  if (!editor) return null

  const handleLinkClick = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="editor-menu">
      {/* Row 1: Undo/Redo, Text formatting */}
      <div className="editor-menu-row">
        <div className="editor-menu-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
            className="icon-button"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
            className="icon-button"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-3-7.7L21 7" />
            </svg>
          </button>
        </div>

        <span className="divider" />

        <div className="editor-menu-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'active' : ''}
            title="Highlight"
          >
            <span className="highlight-icon">A</span>
          </button>
        </div>

        <span className="divider" />

        <div className="editor-menu-group">
          <button
            type="button"
            onClick={handleLinkClick}
            className={`icon-button ${editor.isActive('link') ? 'active' : ''}`}
            title="Add Link"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onImageUpload}
            title="Upload Image"
            className="icon-button"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Headings, Lists, Alignment */}
      <div className="editor-menu-row">
        <div className="editor-menu-group">
          <select
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' :
              editor.isActive('heading', { level: 4 }) ? 'h4' :
              'p'
            }
            onChange={(e) => {
              const value = e.target.value
              if (value === 'p') {
                editor.chain().focus().setParagraph().run()
              } else {
                const level = parseInt(value.replace('h', ''))
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
            className="heading-select"
          >
            <option value="p">paragraph</option>
            <option value="h1">heading 1</option>
            <option value="h2">heading 2</option>
            <option value="h3">heading 3</option>
            <option value="h4">heading 4</option>
          </select>
        </div>

        <span className="divider" />

        <div className="editor-menu-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`icon-button ${editor.isActive('bulletList') ? 'active' : ''}`}
            title="Bullet List"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`icon-button ${editor.isActive('orderedList') ? 'active' : ''}`}
            title="Numbered List"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
              <text x="2" y="8" fontSize="6" fill="currentColor" stroke="none">1</text>
              <text x="2" y="14" fontSize="6" fill="currentColor" stroke="none">2</text>
              <text x="2" y="20" fontSize="6" fill="currentColor" stroke="none">3</text>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`icon-button ${editor.isActive('taskList') ? 'active' : ''}`}
            title="Task List"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="6" height="6" rx="1" />
              <path d="M5 8l1 1 2-2" />
              <line x1="12" y1="8" x2="21" y2="8" />
              <rect x="3" y="13" width="6" height="6" rx="1" />
              <line x1="12" y1="16" x2="21" y2="16" />
            </svg>
          </button>
        </div>

        <span className="divider" />

        <div className="editor-menu-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`icon-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
            title="Align Left"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`icon-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
            title="Align Center"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`icon-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
            title="Align Right"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <span className="divider" />

        <div className="editor-menu-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`icon-button ${editor.isActive('blockquote') ? 'active' : ''}`}
            title="Quote"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`icon-button ${editor.isActive('codeBlock') ? 'active' : ''}`}
            title="Code Block"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
            className="icon-button"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }) {
  const fileInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          loading: 'lazy'
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Highlight.configure({
        multicolor: false
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { url } = await uploadImage(file)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      alert('Failed to upload image: ' + err.message)
    }

    // Reset input
    e.target.value = ''
  }

  return (
    <div className="rich-text-editor">
      <MenuBar editor={editor} onImageUpload={handleImageUpload} />
      <EditorContent editor={editor} className="editor-content" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default RichTextEditor
