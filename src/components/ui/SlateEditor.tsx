'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Descendant, Editor, Element, Node, Path, Point, Range, Text, Transforms } from 'slate'
import { HistoryEditor, withHistory } from 'slate-history'
import { ReactEditor, Slate, withReact } from 'slate-react'

import { LinkModalProvider } from '@/contexts/LinkModalContext'
import { mergeClasses } from '@/lib/merge-classes'
import Label from './Label'

// Import from refactored files
import { Editable } from './slate/Editable'
import { LinkModalContainer } from './slate/LinkModalContainer'
import { deserialize, initialValue, serialize } from './slate/serialization'
import { Toolbar } from './slate/Toolbar'

// --- Helper Functions ---

const replaceContentSilently = (editor: Editor, next: Descendant[]) => {
  try {
    HistoryEditor.withoutSaving(editor, () => {
      Editor.withoutNormalizing(editor, () => {
        // 1) Clear any stale selection so reads during render won't crash
        Transforms.deselect(editor)

        // 2) Remove all existing top-level nodes robustly
        // (Don't assume there's a valid Editor.range when empty.)
        while (editor.children.length > 0) {
          Transforms.removeNodes(editor, { at: [0] })
        }

        // 3) Insert the new document
        Transforms.insertNodes(editor, next, { at: [0] })

        // 4) Safely select the start of the doc (only if there is one)
        if (editor.children.length > 0) {
          try {
            const start = Editor.start(editor, [])
            Transforms.select(editor, start)
          } catch (error) {
            // If we can't get the start point, just leave it unselected
            console.warn('SlateEditor: Could not select start of document:', error)
          }
        }
      })
    })
  } catch (error) {
    console.warn('SlateEditor: Error during content replacement:', error)
    // Fallback: ensure we have at least the initial value
    if (editor.children.length === 0) {
      Transforms.insertNodes(editor, initialValue, { at: [0] })
    }
  }
}

// --- The Main Slate Component ---

const withLinks = <T extends Editor>(editor: T) => {
  const { isInline, insertText, insertBreak, normalizeNode } = editor

  // Treat links as inline
  editor.isInline = (el) => (Element.isElement(el) && el.type === 'link') || isInline(el)

  // Helper: if caret is collapsed at the end of a link, move it right AFTER the link node
  const escapeIfAtEndOfLink = (): void => {
    const { selection } = editor
    if (!selection || !Range.isCollapsed(selection)) return

    const linkEntry = Editor.above(editor, {
      at: selection,
      match: (n) => Element.isElement(n) && n.type === 'link'
    })
    if (!linkEntry) return

    const [, linkPath] = linkEntry
    const linkEnd = Editor.end(editor, linkPath)

    if (!Point.equals(selection.anchor, linkEnd)) return

    // Ensure there's a place to go after the link
    const afterPoint = Editor.after(editor, linkPath)
    if (afterPoint) {
      Transforms.select(editor, afterPoint)
      return
    }

    // If link is last child, create an empty text node after it and move there
    const insertAt = Path.next(linkPath)
    Transforms.insertNodes(editor, { text: '' }, { at: insertAt })
    const afterNow = Editor.after(editor, linkPath)
    if (afterNow) Transforms.select(editor, afterNow)
  }

  editor.insertText = (text) => {
    escapeIfAtEndOfLink()
    insertText(text)
  }

  editor.insertBreak = () => {
    escapeIfAtEndOfLink()
    insertBreak()
  }

  // Optional: enforce "pure text inside link"
  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    const isLink = (node: Node) => Element.isElement(node) && node.type === 'link'

    if (isLink(node)) {
      // If the link is empty, remove it
      if (Node.string(node) === '') {
        Transforms.removeNodes(editor, { at: path })
        return
      }

      // If the link has children, unwrap them
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child)) {
          Transforms.unwrapNodes(editor, { at: childPath })
          return
        }
      }
    }
    return normalizeNode(entry)
  }

  return editor
}

interface SlateEditorProps {
  label?: string
  srcContent?: string
  onUpdate?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  autoFocus?: boolean
}

const SlateEditor = memo(({ label, srcContent = '', onUpdate, placeholder, disabled = false, readOnly = false, className, autoFocus }: SlateEditorProps) => {
  const editor = useMemo(() => withLinks(withHistory(withReact(createEditor()))), [])
  const [isClient, setIsClient] = useState(false)

  const initialSerialized = useRef('')
  const hasUpdated = useRef(false)

  // Helper to check if editor is in a valid state
  const isEditorValid = useCallback(() => {
    try {
      return (
        editor &&
        editor.children &&
        Array.isArray(editor.children) &&
        editor.children.length > 0 &&
        editor.children.every((child) => child && typeof child === 'object')
      )
    } catch {
      return false
    }
  }, [editor])

  // Always start with initialValue to avoid hydration mismatches
  const parsedContent = useMemo(() => initialValue, [])

  // Mark as client-side after first render
  useEffect(() => {
    setIsClient(true)

    // Hot reload recovery: ensure editor has valid content
    if (editor && (!editor.children || editor.children.length === 0)) {
      try {
        replaceContentSilently(editor, initialValue)
      } catch (error) {
        console.warn('SlateEditor: Error during hot reload recovery:', error)
      }
    }
  }, [editor])

  // Update editor content after hydration if we have content to parse
  useEffect(() => {
    if (!isClient) return

    // If we have updated the content ourselves, don't reset (avoids cursor jump)
    if (hasUpdated.current) return

    if (srcContent && srcContent.trim() !== '') {
      try {
        // ... (parsing logic same as before)
        const trimmedContent = srcContent.trim()
        const hasHtmlTags = trimmedContent.startsWith('<') && trimmedContent.endsWith('>')
        const htmlContent = hasHtmlTags ? srcContent : `<p>${srcContent}</p>`
        const document = new DOMParser().parseFromString(htmlContent, 'text/html')
        const parsedValue = (deserialize(document.body) as Descendant[]) || initialValue

        const serialized = parsedValue.map(serialize).join('')

        // If the new content is semantically identical to the last known state, do nothing
        if (serialized === initialSerialized.current) {
          return
        }

        initialSerialized.current = serialized
        hasUpdated.current = false // Reset since this is a fresh external update
        replaceContentSilently(editor, parsedValue)
      } catch (error) {
        // ... error handling
        console.warn('Error parsing content:', error)
        replaceContentSilently(editor, initialValue)
        initialSerialized.current = initialValue.map(serialize).join('')
        hasUpdated.current = false
      }
    } else {
      if (initialSerialized.current === initialValue.map(serialize).join('')) return

      initialSerialized.current = initialValue.map(serialize).join('')
      hasUpdated.current = false
      replaceContentSilently(editor, initialValue)
    }
  }, [isClient, srcContent, editor])

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      // Skip processing during hot reload, invalid states, or when disabled
      if (!isClient || !isEditorValid() || disabled) {
        return
      }

      // Filter out changes that are purely selection updates
      const isSelectionChange = editor.operations.every((op) => op.type === 'set_selection')
      if (isSelectionChange) {
        return
      }

      if (onUpdate) {
        try {
          // Safety check: ensure newValue is a valid array with valid nodes
          const validValue = Array.isArray(newValue)
            ? newValue.filter((node) => node && typeof node === 'object' && (Text.isText(node) || (node.children && Array.isArray(node.children))))
            : []

          if (validValue.length > 0) {
            const html = validValue.map(serialize).join('')

            // If the content matches our initial normalized state:
            // 1. If we haven't updated yet (initial load), don't trigger update to avoid activating Save button
            // 2. If we HAVE updated (user reverted changes), trigger update with original srcContent to reset state
            if (html === initialSerialized.current) {
              if (hasUpdated.current) {
                onUpdate(html)
              } else {
                // Initial matching state, do nothing
                return
              }
            } else {
              onUpdate(html)
              hasUpdated.current = true
              onUpdate(html)
            }
          } else {
            // Fallback to empty content if no valid nodes
            hasUpdated.current = true
            onUpdate('<p></p>')
          }
        } catch (error) {
          console.warn('SlateEditor: Error serializing content during change:', error)
          // Don't update on error to prevent cascading issues
          return
        }
      }
    },
    [onUpdate, isClient, isEditorValid, disabled, editor]
  )

  const containerClass = useMemo(() => mergeClasses('w-full', className), [className])

  const handleLabelClick = useCallback(() => {
    if (!disabled) {
      try {
        // Focus the Slate editor when label is clicked
        ReactEditor.focus(editor)
      } catch (error) {
        console.warn('SlateEditor: Could not focus editor from label click:', error)
      }
    }
  }, [editor, disabled])

  return (
    <div className={containerClass} cy-id="slate-editor">
      {label && (
        <Label disabled={disabled} onClick={handleLabelClick}>
          {label}
        </Label>
      )}
      <LinkModalProvider editor={editor}>
        <Slate editor={editor} initialValue={parsedContent} onChange={handleChange}>
          {!readOnly && !disabled && <Toolbar />}
          <Editable editor={editor} readOnly={readOnly} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} />
        </Slate>

        <LinkModalContainer />
      </LinkModalProvider>
    </div>
  )
})

SlateEditor.displayName = 'SlateEditor'

export default SlateEditor
