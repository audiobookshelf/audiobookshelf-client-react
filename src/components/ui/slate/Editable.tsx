'use client'

import React, { useCallback, useMemo, memo } from 'react'
import { Descendant, Editor, Transforms } from 'slate'
import { Editable as SlateEditable, RenderElementProps, RenderLeafProps } from 'slate-react'

import InputWrapper from '../InputWrapper'
import { mergeClasses } from '@/lib/merge-classes'
import { toggleMark } from './Mark'
import { toggleBlock } from './Block'
import { deserialize, initialValue } from './serialization'
import { useLinkModalContext } from '@/contexts/LinkModalContext'

// --- Renderers ---
const RenderElement = memo(({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'bulleted-list':
      return (
        <ul {...attributes} className="mb-1.5 list-disc list-outside">
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol {...attributes} className="mb-1.5 list-decimal list-outside">
          {children}
        </ol>
      )
    case 'list-item':
      return (
        <li {...attributes} className="text-start ms-4">
          {children}
        </li>
      )
    case 'link':
      return (
        <a
          tabIndex={-1}
          {...attributes}
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline hover:text-blue-400"
        >
          {children}
        </a>
      )
    default:
      return (
        <p {...attributes} className="mt-0 mb-1.5">
          {children}
        </p>
      )
  }
})

const RenderLeaf = memo(({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.strike) children = <s>{children}</s>
  return <span {...attributes}>{children}</span>
})

// --- Editable Interface ---
interface EditableProps {
  editor: Editor
  editableId: string
  readOnly: boolean
  placeholder?: string
}

export const Editable = memo(({ editor, editableId, readOnly, placeholder }: EditableProps) => {
  const { openModal } = useLinkModalContext()
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault()
            toggleMark(editor, 'bold')
            break
          case 'i':
            event.preventDefault()
            toggleMark(editor, 'italic')
            break
          case 's':
            event.preventDefault()
            toggleMark(editor, 'strike')
            break
          case 'k':
            event.preventDefault()
            openModal()
            break
          case 'u':
            event.preventDefault()
            toggleBlock(editor, 'bulleted-list')
            break
          case 'o':
            event.preventDefault()
            toggleBlock(editor, 'numbered-list')
            break
          case 'z':
            event.preventDefault()
            editor.undo()
            break
          case 'y':
            event.preventDefault()
            editor.redo()
            break
        }
      } else if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault()
        Transforms.insertText(editor, '\n')
      }
    },
    [editor, openModal]
  )

  const renderElement = useCallback((props: RenderElementProps) => <RenderElement {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <RenderLeaf {...props} />, [])

  const renderPlaceholder = useCallback(
    ({ children, attributes }: { children: React.ReactNode; attributes: any }) => (
      <span {...attributes} className="absolute top-1 start-1 pointer-events-none opacity-33">
        {children}
      </span>
    ),
    []
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const html = e.clipboardData.getData('text/html')
      const text = e.clipboardData.getData('text/plain')

      // Prefer HTML → sanitize via your deserialize
      if (html) {
        e.preventDefault()
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html')
          let parsed = (deserialize(doc.body) as Descendant[]) || initialValue

          // Clean up and normalize the parsed content
          parsed = parsed.filter((node) => {
            // Remove empty paragraphs
            if ('type' in node && node.type === 'paragraph') {
              const hasContent = node.children.some((child: any) => child.text && child.text.trim())
              return hasContent
            }
            return true
          })

          // Normalize multiple consecutive breaks into paragraph breaks
          const normalizedParsed: Descendant[] = []
          for (let i = 0; i < parsed.length; i++) {
            const node = parsed[i]
            if ('type' in node && node.type === 'paragraph') {
              // Check if this paragraph only contains newlines/breaks
              const isBreakOnly = node.children.every((child: any) => child.text && child.text.trim() === '')

              if (!isBreakOnly) {
                normalizedParsed.push(node)
              }
              // Skip break-only paragraphs - they'll become natural paragraph spacing
            } else {
              normalizedParsed.push(node)
            }
          }

          if (normalizedParsed.length > 0) {
            // Insert fragments rather than replacing
            Transforms.insertFragment(editor, normalizedParsed as any)
          }
        } catch (error) {
          console.warn('Failed to parse HTML paste content:', error)
          // Fall back to plain text handling
          if (text) {
            const parts = text.split(/\r?\n/)
            parts.forEach((p, i) => {
              if (i) editor.insertText('\n')
              editor.insertText(p)
            })
          }
        }
        return
      }

      // Plain text: preserve newlines as soft breaks
      if (text) {
        e.preventDefault()
        const parts = text.split(/\r?\n/)
        parts.forEach((p, i) => {
          if (i) editor.insertText('\n')
          editor.insertText(p)
        })
      }
    },
    [editor]
  )

  const editableClass = useMemo(
    () =>
      mergeClasses(
        'relative whitespace-pre-wrap break-words',
        'p-1 w-full h-26 min-h-26 resize-y overflow-y-auto overflow-x-hidden text-gray-200 text-base focus:outline-none',
        'disabled:text-disabled read-only:text-read-only'
      ),
    []
  )

  return (
    <InputWrapper readOnly={readOnly} size="auto" className={mergeClasses('px-1 py-1')}>
      <SlateEditable
        id={editableId}
        className={editableClass}
        dir="auto"
        readOnly={readOnly}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        renderPlaceholder={renderPlaceholder}
        disableDefaultStyles={true}
        role="textbox"
        aria-multiline="true"
        cy-id="slate-editor-editable"
      />
    </InputWrapper>
  )
})
