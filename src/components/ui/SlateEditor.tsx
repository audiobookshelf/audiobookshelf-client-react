'use client'

import React, { useMemo, useCallback, useEffect, useState, useRef, useId, memo } from 'react'
import { createEditor, Descendant, Editor, Transforms, Text, Element, Range, Node, Point, Path, NodeEntry } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'

import InputWrapper from './InputWrapper'
import IconBtn from '@/components/ui/IconBtn'
import Modal from '@/components/modals/Modal'
import TextInput from '@/components/ui/TextInput'
import Btn from '@/components/ui/Btn'
import Label from './Label'
import { mergeClasses } from '@/lib/merge-classes'
import { escapeHtml } from '@/lib/html-utils'

// --- Type Definitions ---

// DOM type aliases to avoid conflicts with Slate types
type DOMNode = globalThis.Node
type DOMElement = globalThis.Element

// --- Type Definitions for Slate ---

type CustomElement = { type: 'paragraph' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link'; url?: string; children: Descendant[] }
type CustomText = { text: string; bold?: true; italic?: true; strike?: true }

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}

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

// --- Toolbar & Buttons ---

const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  try {
    const { selection } = editor
    if (!selection) return false
    // Guard against transient invalid paths
    if (!Editor.hasPath(editor, selection.anchor.path) || !Editor.hasPath(editor, selection.focus.path)) {
      return false
    }
    // Ensure editor has valid content structure
    if (!editor.children || editor.children.length === 0) {
      return false
    }
    const marks = Editor.marks(editor)
    return marks ? (marks as any)[format] === true : false
  } catch (error) {
    console.warn('SlateEditor: Error checking mark active state:', error)
    return false
  }
}

const isBlockActive = (editor: Editor, format: CustomElement['type']) => {
  try {
    const { selection } = editor
    if (!selection) return false
    // Ensure editor has valid content structure
    if (!editor.children || editor.children.length === 0) {
      return false
    }
    // Guard against transient invalid paths
    if (!Editor.hasPath(editor, selection.anchor.path) || !Editor.hasPath(editor, selection.focus.path)) {
      return false
    }
    const [match] = Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === format
    })
    return !!match
  } catch (error) {
    console.warn('SlateEditor: Error checking block active state:', error)
    return false
  }
}

const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  try {
    // Ensure editor has valid content structure
    if (!editor.children || editor.children.length === 0) {
      return
    }
    const isActive = isMarkActive(editor, format)
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  } catch (error) {
    console.warn('SlateEditor: Error toggling mark:', error)
  }
}

const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
  try {
    // Ensure editor has valid content structure
    if (!editor.children || editor.children.length === 0) {
      return
    }
    const isActive = isBlockActive(editor, format)
    const isList = ['bulleted-list', 'numbered-list'].includes(format)

    Transforms.unwrapNodes(editor, {
      match: (n) => !Editor.isEditor(n) && Element.isElement(n) && ['bulleted-list', 'numbered-list'].includes(n.type),
      split: true
    })

    Transforms.setNodes<Element>(editor, {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format
    })

    if (!isActive && isList) {
      const block = { type: format, children: [] } as CustomElement
      Transforms.wrapNodes(editor, block)
    }
  } catch (error) {
    console.warn('SlateEditor: Error toggling block:', error)
  }
}

const buttonClassBase = mergeClasses(
  'first:border-l-0 first:rounded-l-sm first:rounded-r-none last:rounded-r-sm last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none',
  'focus-visible:-outline-offset-1',
  'h-7'
)

const MarkButton = memo(
  ({
    format,
    children,
    buttonId,
    tabIndex,
    onFocus
  }: {
    format: keyof Omit<CustomText, 'text'>
    children: React.ReactNode
    buttonId: string
    tabIndex: number
    onFocus: () => void
  }) => {
    const editor = useSlate()

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggleMark(editor, format)
        }
      },
      [editor, format]
    )

    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        toggleMark(editor, format)
      },
      [editor, format]
    )

    const isActive = isMarkActive(editor, format)
    const buttonClass = useMemo(() => mergeClasses(buttonClassBase, isActive ? 'bg-gray-300 text-black' : ''), [isActive])

    return (
      <IconBtn
        size="small"
        className={buttonClass}
        tabIndex={tabIndex}
        data-button-id={buttonId}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        {...{ onFocus }}
      >
        {children}
      </IconBtn>
    )
  }
)

const BlockButton = memo(
  ({
    format,
    children,
    buttonId,
    tabIndex,
    onFocus
  }: {
    format: CustomElement['type']
    children: React.ReactNode
    buttonId: string
    tabIndex: number
    onFocus: () => void
  }) => {
    const editor = useSlate()

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggleBlock(editor, format)
        }
      },
      [editor, format]
    )

    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        toggleBlock(editor, format)
      },
      [editor, format]
    )

    const isActive = isBlockActive(editor, format)
    const buttonClass = useMemo(() => mergeClasses(buttonClassBase, isActive ? 'bg-gray-300 text-black' : ''), [isActive])

    return (
      <IconBtn
        size="small"
        className={buttonClass}
        tabIndex={tabIndex}
        data-button-id={buttonId}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        {...{ onFocus }}
      >
        {children}
      </IconBtn>
    )
  }
)

const UndoButton = memo(
  ({ buttonId, tabIndex, onFocus, isUndoAvailable }: { buttonId: string; tabIndex: number; onFocus: () => void; isUndoAvailable: boolean }) => {
    const editor = useSlate() as Editor & HistoryEditor

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (isUndoAvailable) {
            editor.undo()
          }
        }
      },
      [editor, isUndoAvailable]
    )

    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        editor.undo()
      },
      [editor]
    )

    return (
      <IconBtn
        size="small"
        className={buttonClassBase}
        disabled={!isUndoAvailable}
        tabIndex={tabIndex}
        data-button-id={buttonId}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        {...{ onFocus }}
      >
        undo
      </IconBtn>
    )
  }
)

const RedoButton = memo(
  ({ buttonId, tabIndex, onFocus, isRedoAvailable }: { buttonId: string; tabIndex: number; onFocus: () => void; isRedoAvailable: boolean }) => {
    const editor = useSlate() as Editor & HistoryEditor

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (isRedoAvailable) {
            editor.redo()
          }
        }
      },
      [editor, isRedoAvailable]
    )

    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        editor.redo()
      },
      [editor]
    )

    return (
      <IconBtn
        size="small"
        className={buttonClassBase}
        disabled={!isRedoAvailable}
        tabIndex={tabIndex}
        data-button-id={buttonId}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        {...{ onFocus }}
      >
        redo
      </IconBtn>
    )
  }
)

// --- HTML Serialization / Deserialization ---

const serialize = (node: Descendant): string => {
  try {
    // Handle null/undefined nodes gracefully
    if (!node || typeof node !== 'object') {
      return ''
    }

    if (Text.isText(node)) {
      let string = escapeHtml(node.text || '')
      if (node.bold) string = `<strong>${string}</strong>`
      if (node.italic) string = `<em>${string}</em>`
      if (node.strike) string = `<s>${string}</s>`
      // Convert newlines to <br/> tags
      string = string.replace(/\n/g, '<br/>')
      return string
    }

    // Safety check: ensure children exists and is an array with valid nodes
    const children =
      node.children && Array.isArray(node.children)
        ? node.children
            .filter((child) => child && typeof child === 'object')
            .map((n) => serialize(n))
            .join('')
        : ''

    switch (node.type) {
      case 'paragraph':
        return `<p>${children}</p>`
      case 'bulleted-list':
        return `<ul>${children}</ul>`
      case 'numbered-list':
        return `<ol>${children}</ol>`
      case 'list-item':
        return `<li>${children}</li>`
      case 'link':
        return `<a href="${escapeHtml(node.url || '')}">${children}</a>`
      default:
        return children
    }
  } catch (error) {
    console.warn('SlateEditor: Error serializing node:', error, node)
    return ''
  }
}

const deserialize = (el: DOMNode): Descendant[] | CustomText | null => {
  if (el.nodeType === 3) {
    // TEXT_NODE - preserve all text content including spaces
    const textContent = el.textContent || ''
    // Don't filter out single spaces or meaningful whitespace
    // Only filter out completely empty strings or purely newline/tab sequences
    if (!textContent || /^[\n\r\t]*$/.test(textContent)) {
      return null
    }
    return { text: textContent }
  } else if (el.nodeType !== 1) {
    // Skip comment nodes and other non-element nodes
    return null
  }

  const element = el as HTMLElement

  // Helper function to check if an element or its styles indicate bold/italic
  const isBoldElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'STRONG' || nodeName === 'B') return true

    // Check computed styles for font-weight
    try {
      const style = elem.style
      const fontWeight = style.fontWeight || getComputedStyle(elem).fontWeight
      return fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700
    } catch {
      return false
    }
  }

  const isItalicElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'EM' || nodeName === 'I') return true

    // Check computed styles for font-style
    try {
      const style = elem.style
      const fontStyle = style.fontStyle || getComputedStyle(elem).fontStyle
      return fontStyle === 'italic'
    } catch {
      return false
    }
  }

  const isStrikeElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'S' || nodeName === 'STRIKE' || nodeName === 'DEL') return true

    // Check computed styles for text-decoration
    try {
      const style = elem.style
      const textDecoration = style.textDecoration || getComputedStyle(elem).textDecoration
      return textDecoration.includes('line-through')
    } catch {
      return false
    }
  }

  // Process children and flatten spans that are just for styling
  let children = Array.from(element.childNodes)
    .flatMap((child) => {
      const result = deserialize(child)
      if (!result) return []
      return Array.isArray(result) ? result : [result]
    })
    .filter((child) => {
      // Only filter out completely empty text nodes or pure newline/tab sequences
      // BUT preserve intentional line breaks from <br/> elements
      if ('text' in child) {
        if (!child.text) return false
        // Preserve intentional breaks even if they're just newlines
        if ((child as any).isIntentionalBreak) return true
        // Filter out pure structural whitespace (newlines/tabs) but keep spaces
        return !/^[\n\r\t]+$/.test(child.text)
      }
      return true
    })

  // Apply formatting based on current element
  const isBold = isBoldElement(element)
  const isItalic = isItalicElement(element)
  const isStrike = isStrikeElement(element)

  if (isBold || isItalic || isStrike) {
    children = children.map((child) => {
      if ('text' in child) {
        const { isIntentionalBreak, ...cleanChild } = child as any
        return {
          ...cleanChild,
          ...(isBold && { bold: true }),
          ...(isItalic && { italic: true }),
          ...(isStrike && { strike: true })
        }
      }
      return child
    })
  } else {
    // Clean up the intentional break marker even if no formatting is applied
    children = children.map((child) => {
      if ('text' in child && (child as any).isIntentionalBreak) {
        const { isIntentionalBreak, ...cleanChild } = child as any
        return cleanChild
      }
      return child
    })
  }

  if (children.length === 0) {
    children = [{ text: '' }]
  }

  switch (element.nodeName) {
    case 'BODY':
    case 'DIV':
      return children
    case 'P':
      // Filter out empty paragraphs
      const hasContent = children.some((child) => ('text' in child && child.text.trim()) || 'type' in child)
      if (!hasContent) return []
      return [{ type: 'paragraph', children }]
    case 'UL':
      return [{ type: 'bulleted-list', children }]
    case 'OL':
      return [{ type: 'numbered-list', children }]
    case 'LI':
      return [{ type: 'list-item', children }]
    case 'A':
      return [{ type: 'link', url: element.getAttribute('href') || '', children }]
    case 'BR':
      // Use a special marker for intentional line breaks to distinguish from structural whitespace
      return [{ text: '\n', isIntentionalBreak: true } as any]
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      // Treat headings as bold paragraphs
      const headingChildren = children.map((child) => ('text' in child ? { ...child, bold: true as true } : child))
      return [{ type: 'paragraph', children: headingChildren }]
    case 'SPAN':
      // For spans, just return the children with any applied formatting
      // The formatting was already applied above based on classes
      return children
    default:
      // For unknown elements, just return their children
      return children
  }
}

// --- Link Helper Functions ---

const isLinkActive = (editor: Editor) => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
  })
  return !!match
}

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
  })
}

const getSelectedText = (editor: Editor): string => {
  const { selection } = editor
  if (!selection) return ''

  if (Range.isCollapsed(selection)) {
    // If cursor is collapsed, check if we're inside a link
    const [match] = Editor.nodes(editor, {
      at: selection,
      match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
    })

    if (match) {
      // Return the text content of the link
      const [, path] = match
      const text = Editor.string(editor, path)
      return text
    }

    return ''
  }

  return Editor.string(editor, selection)
}

const getLinkUrl = (editor: Editor): string => {
  const { selection } = editor
  if (!selection) return ''

  const [match] = Editor.nodes(editor, {
    at: selection,
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
  })

  if (match) {
    const linkElement = match[0] as CustomElement
    return linkElement.url || ''
  }

  return ''
}

const getActiveLinkEntry = (editor: Editor): NodeEntry<Element> | undefined => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return
  const entry = Editor.above(editor, {
    at: selection,
    match: (n) => Element.isElement(n) && n.type === 'link'
  }) as NodeEntry<Element> | undefined
  return entry
}

const upsertLink = (editor: Editor, text: string, url: string) => {
  const trimmedText = text.trim()
  const { selection } = editor

  if (!selection) return

  // Determine the content: use trimmed user text, or selected text, or URL as fallback
  const selectedText = Editor.string(editor, selection).trim()
  const content = trimmedText || selectedText || url

  // Ensure we don't create empty links
  if (!content.trim()) return

  // Check if selection overlaps any links
  const overlappingLinks = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
    })
  )

  const hasLinkOverlap = overlappingLinks.length > 0

  if (Range.isExpanded(selection)) {
    // EXPANDED SELECTION
    Editor.withoutNormalizing(editor, () => {
      if (hasLinkOverlap) {
        // Selection overlaps a link - unwrap overlapping links and delete selection
        Transforms.unwrapNodes(editor, {
          at: selection,
          match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link',
          split: true
        })
      }

      // Delete the selection and insert new link
      Transforms.delete(editor)
      Transforms.insertNodes(editor, { type: 'link', url, children: [{ text: content }] } as Element)
    })
  } else {
    // COLLAPSED SELECTION (cursor)
    if (hasLinkOverlap) {
      // Cursor is inside a link - replace the entire link
      const [, linkPath] = overlappingLinks[0]
      Editor.withoutNormalizing(editor, () => {
        Transforms.removeNodes(editor, { at: linkPath })
        Transforms.insertNodes(editor, { type: 'link', url, children: [{ text: content }] } as Element, { at: linkPath })
      })
    } else {
      // Cursor not in a link - insert new link at cursor position
      Transforms.insertNodes(editor, { type: 'link', url, children: [{ text: content }] } as Element)
    }
  }

  // Position cursor after the new link
  const inserted = Editor.above(editor, {
    at: editor.selection!,
    match: (n) => Element.isElement(n) && n.type === 'link'
  }) as NodeEntry<Element> | undefined

  if (inserted) {
    const [, linkPath] = inserted
    const after = Editor.after(editor, linkPath)
    if (after) Transforms.select(editor, after)
  }
}

// --- Link Modal Component ---

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onLink: (text: string, url: string) => void
  onUnlink: () => void
  isLinkActive: boolean
  selectedText?: string
  selectedUrl?: string
}

const LinkModal = memo(({ isOpen, onClose, onLink, onUnlink, isLinkActive, selectedText, selectedUrl }: LinkModalProps) => {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // URL validation function
  const validateUrl = useCallback((urlString: string): boolean => {
    if (!urlString.trim()) return false

    try {
      const url = new URL(urlString.trim())
      // Only allow safe protocols - this blocks all dangerous protocols by default
      const allowedProtocols = ['http:', 'https:']

      return allowedProtocols.includes(url.protocol)
    } catch {
      return false
    }
  }, [])

  // Update text and URL when modal opens with selected text/URL
  useEffect(() => {
    if (isOpen) {
      if (selectedText) {
        setText(selectedText)
      } else {
        setText('')
      }

      if (selectedUrl) {
        setUrl(selectedUrl)
      } else {
        setUrl('')
      }

      setUrlError('')

      // Focus the text field when modal opens
      setTimeout(() => {
        textInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, selectedText, selectedUrl])

  // Validate URL on change
  useEffect(() => {
    if (url.trim() && !validateUrl(url)) {
      setUrlError('Please enter a valid http:// or https:// URL')
    } else {
      setUrlError('')
    }
  }, [url, validateUrl])

  const isValidUrl = useMemo(() => validateUrl(url), [url, validateUrl])

  const handleLink = useCallback(() => {
    const trimmedUrl = url.trim()
    if (trimmedUrl && isValidUrl) {
      onLink(text.trim() || trimmedUrl, trimmedUrl)
      onClose()
    }
  }, [text, url, isValidUrl, onLink, onClose])

  const handleUnlink = useCallback(() => {
    onUnlink()
    onClose()
  }, [onUnlink, onClose])

  const handleClose = useCallback(() => {
    setText('')
    setUrl('')
    setUrlError('')
    onClose()
  }, [onClose])

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        urlInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [handleClose]
  )

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (isValidUrl) {
          handleLink()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [isValidUrl, handleLink, handleClose]
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width={400}>
      <div className="bg-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Insert Link</h3>

        <div className="space-y-4">
          <div>
            <TextInput
              ref={textInputRef}
              label="Text"
              placeholder="Link text (optional)"
              value={text}
              onChange={setText}
              onKeyDown={handleTextKeyDown}
              enterKeyHint="next"
            />
          </div>

          <div>
            <TextInput
              ref={urlInputRef}
              label="URL"
              placeholder="https://example.com"
              value={url}
              onChange={setUrl}
              onKeyDown={handleUrlKeyDown}
              enterKeyHint="done"
              error={urlError}
            />
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <Btn color="bg-button-selected-bg disabled:bg-button-selected-bg/80" onClick={handleLink} disabled={!isValidUrl}>
              Link
            </Btn>

            {isLinkActive && (
              <Btn color="bg-primary" onClick={handleUnlink}>
                Unlink
              </Btn>
            )}

            <Btn color="bg-primary" onClick={handleClose}>
              Cancel
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
})

// --- Link Button Component ---

interface LinkButtonProps {
  onOpenModal: () => void
}

const LinkButton = memo(
  ({
    onOpenModal,
    buttonId,
    tabIndex,
    onFocus
  }: LinkButtonProps & {
    buttonId: string
    tabIndex: number
    onFocus: () => void
  }) => {
    const editor = useSlate()
    const isActive = isLinkActive(editor)

    const handleOpenModal = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault()
        onOpenModal()
      },
      [onOpenModal]
    )

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenModal()
        }
      },
      [onOpenModal]
    )

    const buttonClass = useMemo(() => mergeClasses(buttonClassBase, isActive ? 'bg-gray-300 text-black' : ''), [isActive])

    return (
      <IconBtn
        size="small"
        className={buttonClass}
        tabIndex={tabIndex}
        data-button-id={buttonId}
        onMouseDown={handleOpenModal}
        onKeyDown={handleKeyDown}
        {...{ onFocus }}
      >
        link
      </IconBtn>
    )
  }
)

// --- The Main Slate Component ---

const initialValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

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
  id?: string
  label?: string
  srcContent?: string
  onUpdate?: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

const SlateEditor = memo(({ id, label, srcContent = '', onUpdate, placeholder, readOnly = false, className }: SlateEditorProps) => {
  const generatedId = useId()
  const slateEditorId = useMemo(() => id || generatedId, [id, generatedId])
  const editableId = useMemo(() => `${slateEditorId}-editable`, [slateEditorId])
  const editor = useMemo(() => withLinks(withHistory(withReact(createEditor()))), [])
  const [isClient, setIsClient] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedUrl, setSelectedUrl] = useState('')
  const [focusedButtonId, setFocusedButtonId] = useState<string>('bold') // Track which button should have tabIndex={0}
  const [historyState, setHistoryState] = useState({ undos: 0, redos: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

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

  // Get undo/redo availability - using state that gets updated on changes
  const isUndoAvailable = useMemo(() => historyState.undos > 0, [historyState.undos])
  const isRedoAvailable = useMemo(() => historyState.redos > 0, [historyState.redos])

  // Get button availability status
  const buttonAvailability = useMemo(
    () => ({
      bold: true,
      italic: true,
      strike: true,
      'bulleted-list': true,
      'numbered-list': true,
      link: true,
      undo: isUndoAvailable,
      redo: isRedoAvailable
    }),
    [isUndoAvailable, isRedoAvailable]
  )

  // Get list of available (non-disabled) button IDs in order
  const availableButtons = useMemo(() => {
    const allButtons = ['bold', 'italic', 'strike', 'bulleted-list', 'numbered-list', 'link', 'undo', 'redo']
    return allButtons.filter((buttonId) => buttonAvailability[buttonId as keyof typeof buttonAvailability])
  }, [buttonAvailability])

  // Auto-focus fallback when current focused button becomes unavailable
  useEffect(() => {
    const isFocusedButtonAvailable = buttonAvailability[focusedButtonId as keyof typeof buttonAvailability]

    if (!isFocusedButtonAvailable) {
      if (availableButtons.length > 0) {
        let newFocusedButton = availableButtons[0]

        // Special handling for undo/redo buttons - prefer switching to the other one
        if (focusedButtonId === 'undo' && buttonAvailability.redo) {
          newFocusedButton = 'redo'
        } else if (focusedButtonId === 'redo' && buttonAvailability.undo) {
          newFocusedButton = 'undo'
        }

        setFocusedButtonId(newFocusedButton)

        // If we have a toolbar ref, try to move focus
        if (toolbarRef.current) {
          const newButtonElement = toolbarRef.current.querySelector(`[data-button-id="${newFocusedButton}"]`) as HTMLButtonElement
          if (newButtonElement && !newButtonElement.disabled) {
            // Use a small delay to ensure React has updated the disabled state
            setTimeout(() => {
              if (!newButtonElement.disabled) {
                newButtonElement.focus()
              }
            }, 0)
          }
        }
      }
    }
  }, [isUndoAvailable, isRedoAvailable, focusedButtonId, buttonAvailability, availableButtons])

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

  // Initialize and update history state
  useEffect(() => {
    const updateHistoryState = () => {
      setHistoryState((prev) => {
        const next = { undos: editor.history.undos?.length || 0, redos: editor.history.redos?.length || 0 }
        return prev.undos === next.undos && prev.redos === next.redos ? prev : next
      })
    }

    // Set initial state
    updateHistoryState()
  }, [editor])

  // Handle focus loss from disabled buttons
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const handleFocusOut = (event: FocusEvent) => {
      // Check if focus is leaving the toolbar entirely
      const relatedTarget = event.relatedTarget as DOMElement | null
      const isStayingInToolbar = relatedTarget && toolbar.contains(relatedTarget)

      if (!isStayingInToolbar) {
        // Focus left the toolbar, check if we need to restore it
        const isFocusedButtonAvailable = buttonAvailability[focusedButtonId as keyof typeof buttonAvailability]

        if (!isFocusedButtonAvailable) {
          // The focused button became unavailable, move to best available
          if (availableButtons.length > 0) {
            let newFocusedButton = availableButtons[0]

            // Special handling for undo/redo buttons - prefer switching to the other one
            if (focusedButtonId === 'undo' && buttonAvailability.redo) {
              newFocusedButton = 'redo'
            } else if (focusedButtonId === 'redo' && buttonAvailability.undo) {
              newFocusedButton = 'undo'
            }

            setFocusedButtonId(newFocusedButton)

            setTimeout(() => {
              const newButtonElement = toolbar.querySelector(`[data-button-id="${newFocusedButton}"]`) as HTMLButtonElement
              if (newButtonElement && !newButtonElement.disabled) {
                newButtonElement.focus()
              }
            }, 0)
          }
        }
      }
    }

    toolbar.addEventListener('focusout', handleFocusOut)
    return () => toolbar.removeEventListener('focusout', handleFocusOut)
  }, [focusedButtonId, buttonAvailability, availableButtons])

  // Update editor content after hydration if we have content to parse
  useEffect(() => {
    if (isClient && srcContent && srcContent.trim() !== '') {
      try {
        const document = new DOMParser().parseFromString(srcContent, 'text/html')
        const parsedValue = (deserialize(document.body) as Descendant[]) || initialValue
        replaceContentSilently(editor, parsedValue)
      } catch (error) {
        console.warn('Error parsing content:', error)
        // Fallback to initial value if parsing fails
        replaceContentSilently(editor, initialValue)
      }
    }
  }, [isClient, srcContent, editor])

  // Refocus editor whenever the modal closes
  useEffect(() => {
    if (!isLinkModalOpen && !readOnly) {
      // If the modal was cancelled, selection likely didn't change; if it did,
      // and you want to *force* restoring, uncomment the block below:
      // if (!editor.selection && savedSelectionRef.current) {
      //   Transforms.select(editor, savedSelectionRef.current)
      // }

      // Focus on the next frame so it's after the DOM updates/unmount
      requestAnimationFrame(() => {
        try {
          // Safety check: ensure editor has valid content before focusing
          if (editor.children.length > 0) {
            // Check if there's at least one text node in the editor
            const hasTextNode = Editor.nodes(editor, {
              at: [],
              match: (n) => Text.isText(n)
            }).next().value

            if (hasTextNode) {
              ReactEditor.focus(editor)
            }
          }
        } catch (error) {
          // Silently handle focus errors during hot reload or invalid states
          console.warn('SlateEditor: Could not focus editor:', error)
        }
      })
    }
  }, [isLinkModalOpen, readOnly, editor])

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      // Skip processing during hot reload or invalid states
      if (!isClient || !isEditorValid()) {
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
            onUpdate(html)
          } else {
            // Fallback to empty content if no valid nodes
            onUpdate('<p></p>')
          }
        } catch (error) {
          console.warn('SlateEditor: Error serializing content during change:', error)
          // Don't update on error to prevent cascading issues
          return
        }
      }

      // Update history state for button availability (with safety check)
      try {
        if (editor.history) {
          setHistoryState((prev) => {
            const next = { undos: editor.history.undos?.length || 0, redos: editor.history.redos?.length || 0 }
            return prev.undos === next.undos && prev.redos === next.redos ? prev : next
          })
        }
      } catch (error) {
        console.warn('SlateEditor: Error updating history state:', error)
      }
    },
    [onUpdate, editor, isClient, isEditorValid]
  )

  const handleLink = useCallback(
    (text: string, url: string) => {
      upsertLink(editor, text, url)
    },
    [editor]
  )

  const handleUnlink = useCallback(() => {
    unwrapLink(editor)
  }, [editor])

  const handleOpenLinkModal = useCallback(() => {
    const text = getSelectedText(editor)
    const url = getLinkUrl(editor)
    setSelectedText(text)
    setSelectedUrl(url)
    setIsLinkModalOpen(true)
  }, [editor])

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
            handleOpenLinkModal()
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
    [editor, handleOpenLinkModal]
  )

  const renderElement = useCallback((props: RenderElementProps) => <RenderElement {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <RenderLeaf {...props} />, [])

  const renderPlaceholder = useCallback(
    ({ children, attributes }: { children: React.ReactNode; attributes: any }) => (
      <span {...attributes} className="absolute top-1 left-1 pointer-events-none opacity-33">
        {children}
      </span>
    ),
    []
  )

  // Handle toolbar keyboard navigation with roving tabindex
  const handleToolbarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const toolbar = e.currentTarget as HTMLElement
      const buttons = Array.from(toolbar.querySelectorAll('button:not([disabled])'))
      const currentIndex = buttons.findIndex((button) => button === document.activeElement)

      if (currentIndex === -1) return

      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          nextIndex = (currentIndex + 1) % buttons.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
          break
        case 'Home':
          e.preventDefault()
          nextIndex = 0
          break
        case 'End':
          e.preventDefault()
          nextIndex = buttons.length - 1
          break
        default:
          return
      }

      const nextButton = buttons[nextIndex] as HTMLButtonElement
      if (nextButton) {
        // Update the focused button ID based on the button's data attribute
        const buttonId = nextButton.getAttribute('data-button-id')
        if (buttonId) {
          // Only update focus if the button is available
          const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]
          if (isButtonAvailable) {
            setFocusedButtonId(buttonId)
            nextButton.focus()
          }
        }
      }
    },
    [buttonAvailability]
  )

  // Helper to determine if a button should have tabIndex={0}
  const getTabIndex = useCallback(
    (buttonId: string) => {
      const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]

      // Disabled buttons should never have tabIndex=0
      if (!isButtonAvailable) {
        return -1
      }

      return focusedButtonId === buttonId ? 0 : -1
    },
    [focusedButtonId, buttonAvailability]
  )

  // Handle when a button receives focus (for click or programmatic focus)
  const handleButtonFocus = useCallback(
    (buttonId: string) => {
      const isButtonAvailable = buttonAvailability[buttonId as keyof typeof buttonAvailability]

      // Only allow focusing on available buttons
      if (isButtonAvailable) {
        setFocusedButtonId(buttonId)
      }
    },
    [buttonAvailability]
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

  const containerClass = useMemo(() => mergeClasses('min-w-75', className), [className])

  return (
    <div className={containerClass} cy-id="slate-editor">
      {label && <Label htmlFor={editableId}>{label}</Label>}
      <Slate editor={editor} initialValue={parsedContent} onChange={handleChange}>
        {!readOnly && (
          <div
            ref={toolbarRef}
            className="pb-2 border-b border-border bg-transparent flex gap-[1.5vw]"
            role="toolbar"
            aria-label="Text formatting toolbar"
            aria-orientation="horizontal"
            onKeyDown={handleToolbarKeyDown}
          >
            <div role="group" aria-label="Text" className="flex border border-border rounded-sm overflow-hidden">
              <MarkButton format="bold" buttonId="bold" tabIndex={getTabIndex('bold')} onFocus={() => handleButtonFocus('bold')}>
                format_bold
              </MarkButton>
              <MarkButton format="italic" buttonId="italic" tabIndex={getTabIndex('italic')} onFocus={() => handleButtonFocus('italic')}>
                format_italic
              </MarkButton>
              <MarkButton format="strike" buttonId="strike" tabIndex={getTabIndex('strike')} onFocus={() => handleButtonFocus('strike')}>
                format_strikethrough
              </MarkButton>
              <LinkButton onOpenModal={handleOpenLinkModal} buttonId="link" tabIndex={getTabIndex('link')} onFocus={() => handleButtonFocus('link')} />
            </div>
            <div role="group" aria-label="Lists" className="flex border border-border rounded-sm overflow-hidden">
              <BlockButton
                format="bulleted-list"
                buttonId="bulleted-list"
                tabIndex={getTabIndex('bulleted-list')}
                onFocus={() => handleButtonFocus('bulleted-list')}
              >
                format_list_bulleted
              </BlockButton>
              <BlockButton
                format="numbered-list"
                buttonId="numbered-list"
                tabIndex={getTabIndex('numbered-list')}
                onFocus={() => handleButtonFocus('numbered-list')}
              >
                format_list_numbered
              </BlockButton>
            </div>
            <div className="flex-grow" />
            <div role="group" aria-label="History" className="flex border border-border rounded-sm overflow-hidden">
              <UndoButton buttonId="undo" tabIndex={getTabIndex('undo')} onFocus={() => handleButtonFocus('undo')} isUndoAvailable={isUndoAvailable} />
              <RedoButton buttonId="redo" tabIndex={getTabIndex('redo')} onFocus={() => handleButtonFocus('redo')} isRedoAvailable={isRedoAvailable} />
            </div>
          </div>
        )}
        <InputWrapper readOnly={readOnly} size="auto" className={mergeClasses('px-1 py-1')}>
          <Editable
            id={editableId}
            className={useMemo(
              () =>
                mergeClasses(
                  'relative whitespace-pre-wrap break-words',
                  'p-1 w-full h-26 min-h-26 resize-y overflow-y-auto overflow-x-hidden text-gray-200 text-base focus:outline-none',
                  'disabled:text-disabled read-only:text-read-only'
                ),
              []
            )}
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
      </Slate>

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLink}
        onUnlink={handleUnlink}
        isLinkActive={isLinkActive(editor)}
        selectedText={selectedText}
        selectedUrl={selectedUrl}
      />
    </div>
  )
})

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

export default SlateEditor
