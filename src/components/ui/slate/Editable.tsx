'use client'

import React, { memo, useCallback, useMemo, useRef } from 'react'
import { Descendant, Editor, Transforms } from 'slate'
import { RenderElementProps, RenderLeafProps, Editable as SlateEditable } from 'slate-react'

import { useLinkModalContext } from '@/contexts/LinkModalContext'
import { mergeClasses } from '@/lib/merge-classes'
import InputWrapper from '../InputWrapper'
import { toggleBlock } from './Block'
import { slateElementStyles } from './constants'
import { toggleMark } from './Mark'
import { deserialize, initialValue } from './serialization'

// --- Renderers ---
const RenderElement = memo(({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'link':
      return (
        <a tabIndex={-1} {...attributes} href={element.url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    default:
      return <p {...attributes}>{children}</p>
  }
})

RenderElement.displayName = 'RenderElement'

const RenderLeaf = memo(({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.strike) children = <s>{children}</s>
  return <span {...attributes}>{children}</span>
})

RenderLeaf.displayName = 'RenderLeaf'

// --- Editable Interface ---
interface EditableProps {
  editor: Editor
  disabled: boolean
  readOnly: boolean
  placeholder?: string
}

export const Editable = memo(({ editor, disabled, readOnly, placeholder }: EditableProps) => {
  const { openModal } = useLinkModalContext()
  const editableRef = useRef<HTMLDivElement>(null)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Early return if disabled - prevent all keyboard interactions
      if (disabled) {
        return
      }

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
    [editor, openModal, disabled]
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
      // Early return if disabled - prevent paste operations
      if (disabled) {
        e.preventDefault()
        return
      }

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
    [editor, disabled]
  )

  const editableClass = useMemo(
    () =>
      mergeClasses(
        'relative whitespace-pre-wrap break-words',
        'p-1 w-full h-26 min-h-26 resize-y overflow-y-auto overflow-x-hidden text-base focus:outline-none',
        // Apply disabled/readonly styling based on state
        disabled ? 'text-disabled cursor-not-allowed pointer-events-none' : readOnly ? 'text-read-only' : 'text-gray-200',
        // Element-specific styles using child selectors
        slateElementStyles
      ),
    [disabled, readOnly]
  )

  return (
    <InputWrapper size="auto" className={mergeClasses('px-1 py-1')} readOnly={readOnly} disabled={disabled} inputRef={editableRef}>
      <SlateEditable
        ref={editableRef}
        className={editableClass}
        dir="auto"
        readOnly={readOnly || disabled}
        tabIndex={disabled ? -1 : 0}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        renderPlaceholder={renderPlaceholder}
        disableDefaultStyles={true}
        role="textbox"
        aria-multiline="true"
        aria-disabled={disabled}
        inert={disabled ? true : undefined}
        cy-id="slate-editor-editable"
      />
    </InputWrapper>
  )
})

Editable.displayName = 'Editable'
