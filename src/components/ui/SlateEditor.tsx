'use client'

import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { createEditor, Descendant, Editor, Transforms, Text, Element as SlateElement, Range, Node as SlateNode, Point, Path, NodeEntry } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'

import InputWrapper from './InputWrapper'
import styles from './SlateEditor.module.css'
import IconBtn from '@/components/ui/IconBtn'
import Modal from '@/components/modals/Modal'
import TextInput from '@/components/ui/TextInput'
import Btn from '@/components/ui/Btn'
import { mergeClasses } from '@/lib/merge-classes'
import { escapeHtml } from '@/lib/html-utils'

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

function replaceContentSilently(editor: Editor, next: Descendant[]) {
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
        const start = Editor.start(editor, [])
        Transforms.select(editor, start)
      }
    })
  })
}

// --- Toolbar & Buttons ---

const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const { selection } = editor
  if (!selection) return false
  // Guard against transient invalid paths
  if (!Editor.hasPath(editor, selection.anchor.path) || !Editor.hasPath(editor, selection.focus.path)) {
    return false
  }
  const marks = Editor.marks(editor)
  return marks ? (marks as any)[format] === true : false
}

const isBlockActive = (editor: Editor, format: CustomElement['type']) => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format
  })
  return !!match
}

const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
  const isActive = isBlockActive(editor, format)
  const isList = ['bulleted-list', 'numbered-list'].includes(format)

  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && ['bulleted-list', 'numbered-list'].includes(n.type),
    split: true
  })

  Transforms.setNodes<SlateElement>(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format
  })

  if (!isActive && isList) {
    const block = { type: format, children: [] } as CustomElement
    Transforms.wrapNodes(editor, block)
  }
}

const MarkButton = ({
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

  return (
    <IconBtn
      size="small"
      className={mergeClasses(isMarkActive(editor, format) ? styles.activeButton : styles.toolbarButton, 'h-7')}
      tabIndex={tabIndex}
      data-button-id={buttonId}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
      onKeyDown={handleKeyDown}
      {...{ onFocus }}
    >
      {children}
    </IconBtn>
  )
}

const BlockButton = ({
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

  return (
    <IconBtn
      size="small"
      className={mergeClasses(isBlockActive(editor, format) ? styles.activeButton : styles.toolbarButton, 'h-7')}
      tabIndex={tabIndex}
      data-button-id={buttonId}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      onKeyDown={handleKeyDown}
      {...{ onFocus }}
    >
      {children}
    </IconBtn>
  )
}

const UndoButton = ({
  buttonId,
  tabIndex,
  onFocus,
  isUndoAvailable
}: {
  buttonId: string
  tabIndex: number
  onFocus: () => void
  isUndoAvailable: boolean
}) => {
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

  return (
    <IconBtn
      size="small"
      className={mergeClasses(styles.toolbarButton, 'h-7')}
      disabled={!isUndoAvailable}
      tabIndex={tabIndex}
      data-button-id={buttonId}
      onMouseDown={(event) => {
        event.preventDefault()
        editor.undo()
      }}
      onKeyDown={handleKeyDown}
      {...{ onFocus }}
    >
      undo
    </IconBtn>
  )
}

const RedoButton = ({
  buttonId,
  tabIndex,
  onFocus,
  isRedoAvailable
}: {
  buttonId: string
  tabIndex: number
  onFocus: () => void
  isRedoAvailable: boolean
}) => {
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

  return (
    <IconBtn
      size="small"
      className={mergeClasses(styles.toolbarButton, 'h-7')}
      disabled={!isRedoAvailable}
      tabIndex={tabIndex}
      data-button-id={buttonId}
      onMouseDown={(event) => {
        event.preventDefault()
        editor.redo()
      }}
      onKeyDown={handleKeyDown}
      {...{ onFocus }}
    >
      redo
    </IconBtn>
  )
}

// --- HTML Serialization / Deserialization ---

const serialize = (node: Descendant): string => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text)
    if (node.bold) string = `<strong>${string}</strong>`
    if (node.italic) string = `<em>${string}</em>`
    if (node.strike) string = `<s>${string}</s>`
    // Convert newlines to <br/> tags
    string = string.replace(/\n/g, '<br/>')
    return string
  }

  const children = node.children.map((n) => serialize(n)).join('')

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
}

const deserialize = (el: Node): Descendant[] | CustomText | null => {
  if (el.nodeType === 3) {
    // TEXT_NODE
    return el.textContent ? { text: el.textContent } : null
  } else if (el.nodeType !== 1) {
    // ELEMENT_NODE
    return null
  }

  const element = el as HTMLElement
  let children = Array.from(element.childNodes).flatMap((child) => deserialize(child) || [])

  if (children.length === 0) {
    children = [{ text: '' }]
  }

  switch (element.nodeName) {
    case 'BODY':
      return children
    case 'P':
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
      return [{ text: '\n' }]
    case 'STRONG':
    case 'B':
      return children.map((child) => ({ ...child, bold: true }))
    case 'EM':
    case 'I':
      return children.map((child) => ({ ...child, italic: true }))
    case 'S':
      return children.map((child) => ({ ...child, strike: true }))
    default:
      return children
  }
}

// --- Link Helper Functions ---

const isLinkActive = (editor: Editor) => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link'
  })
  return !!match
}

const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link'
  })
}

const getSelectedText = (editor: Editor): string => {
  const { selection } = editor
  if (!selection) return ''

  if (Range.isCollapsed(selection)) {
    // If cursor is collapsed, check if we're inside a link
    const [match] = Editor.nodes(editor, {
      at: selection,
      match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link'
    })

    if (match) {
      // Return the text content of the link
      const [, path] = match
      const text = Editor.string(editor, path)
      console.log('text', text)
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
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link'
  })

  if (match) {
    const linkElement = match[0] as CustomElement
    return linkElement.url || ''
  }

  return ''
}

const getActiveLinkEntry = (editor: Editor): NodeEntry<SlateElement> | undefined => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return
  const entry = Editor.above(editor, {
    at: selection,
    match: (n) => SlateElement.isElement(n) && n.type === 'link'
  }) as NodeEntry<SlateElement> | undefined
  return entry
}

const upsertLink = (editor: Editor, text: string, url: string) => {
  const trimmedText = text.trim()
  const { selection } = editor
  const linkEntry = getActiveLinkEntry(editor)

  // CASE 1: caret is inside an existing link → replace its text & url
  if (linkEntry) {
    const [, linkPath] = linkEntry
    const newText = trimmedText || Editor.string(editor, linkPath) || url

    Editor.withoutNormalizing(editor, () => {
      // Replace the whole link node with a new one that has the desired text/url
      Transforms.removeNodes(editor, { at: linkPath })
      Transforms.insertNodes(editor, { type: 'link', url, children: [{ text: newText }] } as SlateElement, { at: linkPath })
      // land the caret AFTER the link so typing continues outside
      const after = Editor.after(editor, linkPath)
      if (after) Transforms.select(editor, after)
    })
    return
  }

  // CASE 2: collapsed selection but not in a link → insert a new inline link
  if (!selection || Range.isCollapsed(selection)) {
    const content = trimmedText || url
    Transforms.insertNodes(editor, { type: 'link', url, children: [{ text: content }] } as SlateElement)
    const inserted = Editor.above(editor, {
      at: editor.selection!,
      match: (n) => SlateElement.isElement(n) && n.type === 'link'
    }) as NodeEntry<SlateElement> | undefined
    if (inserted) {
      const [, p] = inserted
      const after = Editor.after(editor, p)
      if (after) Transforms.select(editor, after)
    }
    return
  }

  // CASE 3: expanded selection → wrap the selection with a link
  Transforms.wrapNodes(editor, { type: 'link', url, children: [] } as SlateElement, { split: true })
  Transforms.collapse(editor, { edge: 'end' })
  const wrapped = Editor.above(editor, {
    at: editor.selection!,
    match: (n) => SlateElement.isElement(n) && n.type === 'link'
  }) as NodeEntry<SlateElement> | undefined
  if (wrapped) {
    const [, p] = wrapped
    const after = Editor.after(editor, p)
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

const LinkModal = ({ isOpen, onClose, onLink, onUnlink, isLinkActive, selectedText, selectedUrl }: LinkModalProps) => {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

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
    }
  }, [isOpen, selectedText, selectedUrl])

  const handleLink = useCallback(() => {
    if (url.trim()) {
      onLink(text.trim() || url.trim(), url.trim())
      onClose()
    }
  }, [text, url, onLink, onClose])

  const handleUnlink = useCallback(() => {
    onUnlink()
    onClose()
  }, [onUnlink, onClose])

  const handleClose = useCallback(() => {
    setText('')
    setUrl('')
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width={400}>
      <div className="bg-gray-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Insert Link</h3>

        <div className="space-y-4">
          <TextInput label="Text" placeholder="Link text (optional)" value={text} onChange={setText} />

          <TextInput label="URL" placeholder="https://example.com" value={url} onChange={setUrl} />

          <div className="flex gap-2 pt-2">
            <Btn color="bg-primary" onClick={handleLink} disabled={!url.trim()}>
              Link
            </Btn>

            {isLinkActive && (
              <Btn color="bg-gray-600" onClick={handleUnlink}>
                Unlink
              </Btn>
            )}

            <Btn color="bg-gray-600" onClick={handleClose}>
              Cancel
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// --- Link Button Component ---

interface LinkButtonProps {
  onOpenModal: () => void
}

const LinkButton = ({
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

  return (
    <IconBtn
      size="small"
      className={mergeClasses(isActive ? styles.activeButton : styles.toolbarButton, 'h-7')}
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

// --- The Main Slate Component ---

const initialValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

interface SlateEditorProps {
  srcContent?: string
  onUpdate?: (html: string) => void
  placeholder?: string
  disabledEditor?: boolean
  autofocus?: boolean
}

const withLinks = <T extends Editor>(editor: T) => {
  const { isInline, insertText, insertBreak, normalizeNode } = editor

  // Treat links as inline
  editor.isInline = (el) => (SlateElement.isElement(el) && el.type === 'link') || isInline(el)

  // Helper: if caret is collapsed at the end of a link, move it right AFTER the link node
  const escapeIfAtEndOfLink = (): void => {
    const { selection } = editor
    if (!selection || !Range.isCollapsed(selection)) return

    const linkEntry = Editor.above(editor, {
      at: selection,
      match: (n) => SlateElement.isElement(n) && n.type === 'link'
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
    if (SlateElement.isElement(node) && node.type === 'link') {
      for (const [child, childPath] of SlateNode.children(editor, path)) {
        if (SlateElement.isElement(child)) {
          Transforms.unwrapNodes(editor, { at: childPath })
          return
        }
      }
    }
    return normalizeNode(entry)
  }

  return editor
}

const SlateEditor = ({ srcContent = '', onUpdate, placeholder, disabledEditor = false, autofocus = false }: SlateEditorProps) => {
  const editor = useMemo(() => withLinks(withHistory(withReact(createEditor()))), [])
  const [isClient, setIsClient] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedUrl, setSelectedUrl] = useState('')
  const [focusedButtonId, setFocusedButtonId] = useState<string>('bold') // Track which button should have tabIndex={0}
  const [historyState, setHistoryState] = useState({ undos: 0, redos: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Get undo/redo availability - using state that gets updated on changes
  const isUndoAvailable = historyState.undos > 0
  const isRedoAvailable = historyState.redos > 0

  // Get button availability status
  const getButtonAvailability = useCallback(() => {
    return {
      bold: true,
      italic: true,
      strike: true,
      'bulleted-list': true,
      'numbered-list': true,
      link: true,
      undo: isUndoAvailable,
      redo: isRedoAvailable
    }
  }, [isUndoAvailable, isRedoAvailable])

  // Get list of available (non-disabled) button IDs in order
  const getAvailableButtons = useCallback(() => {
    const availability = getButtonAvailability()
    const allButtons = ['bold', 'italic', 'strike', 'bulleted-list', 'numbered-list', 'link', 'undo', 'redo']
    return allButtons.filter((buttonId) => availability[buttonId as keyof typeof availability])
  }, [getButtonAvailability])

  // Auto-focus fallback when current focused button becomes unavailable
  useEffect(() => {
    const availability = getButtonAvailability()
    const isFocusedButtonAvailable = availability[focusedButtonId as keyof typeof availability]

    if (!isFocusedButtonAvailable) {
      const availableButtons = getAvailableButtons()
      if (availableButtons.length > 0) {
        let newFocusedButton = availableButtons[0]

        // Special handling for undo/redo buttons - prefer switching to the other one
        if (focusedButtonId === 'undo' && availability.redo) {
          newFocusedButton = 'redo'
        } else if (focusedButtonId === 'redo' && availability.undo) {
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
  }, [isUndoAvailable, isRedoAvailable, focusedButtonId, getButtonAvailability, getAvailableButtons])

  // Always start with initialValue to avoid hydration mismatches
  const parsedContent = useMemo(() => {
    return initialValue
  }, [])

  // Mark as client-side after first render
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize and update history state
  useEffect(() => {
    const updateHistoryState = () => {
      setHistoryState({
        undos: editor.history.undos.length,
        redos: editor.history.redos.length
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
      const relatedTarget = event.relatedTarget as Element | null
      const isStayingInToolbar = relatedTarget && toolbar.contains(relatedTarget)

      if (!isStayingInToolbar) {
        // Focus left the toolbar, check if we need to restore it
        const availability = getButtonAvailability()
        const isFocusedButtonAvailable = availability[focusedButtonId as keyof typeof availability]

        if (!isFocusedButtonAvailable) {
          // The focused button became unavailable, move to best available
          const availableButtons = getAvailableButtons()
          if (availableButtons.length > 0) {
            let newFocusedButton = availableButtons[0]

            // Special handling for undo/redo buttons - prefer switching to the other one
            if (focusedButtonId === 'undo' && availability.redo) {
              newFocusedButton = 'redo'
            } else if (focusedButtonId === 'redo' && availability.undo) {
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
  }, [focusedButtonId, getButtonAvailability, getAvailableButtons])

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
    if (!isLinkModalOpen && !disabledEditor) {
      // If the modal was cancelled, selection likely didn't change; if it did,
      // and you want to *force* restoring, uncomment the block below:
      // if (!editor.selection && savedSelectionRef.current) {
      //   Transforms.select(editor, savedSelectionRef.current)
      // }

      // Focus on the next frame so it's after the DOM updates/unmount
      requestAnimationFrame(() => ReactEditor.focus(editor))
    }
  }, [isLinkModalOpen, disabledEditor, editor])

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      if (onUpdate) {
        const html = newValue.map(serialize).join('')
        onUpdate(html)
      }

      // Update history state for button availability
      setHistoryState({
        undos: editor.history.undos.length,
        redos: editor.history.redos.length
      })
    },
    [onUpdate, editor]
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
    [editor]
  )

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])

  const renderPlaceholder = useCallback(
    ({ children, attributes }: { children: React.ReactNode; attributes: any }) => (
      <span {...attributes} style={{ top: '4px', left: '4px' }}>
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
          const availability = getButtonAvailability()
          const isButtonAvailable = availability[buttonId as keyof typeof availability]
          if (isButtonAvailable) {
            setFocusedButtonId(buttonId)
            nextButton.focus()
          }
        }
      }
    },
    [setFocusedButtonId, getButtonAvailability]
  )

  // Helper to determine if a button should have tabIndex={0}
  const getTabIndex = useCallback(
    (buttonId: string) => {
      const availability = getButtonAvailability()
      const isButtonAvailable = availability[buttonId as keyof typeof availability]

      // Disabled buttons should never have tabIndex=0
      if (!isButtonAvailable) {
        return -1
      }

      return focusedButtonId === buttonId ? 0 : -1
    },
    [focusedButtonId, getButtonAvailability]
  )

  // Handle when a button receives focus (for click or programmatic focus)
  const handleButtonFocus = useCallback(
    (buttonId: string) => {
      const availability = getButtonAvailability()
      const isButtonAvailable = availability[buttonId as keyof typeof availability]

      // Only allow focusing on available buttons
      if (isButtonAvailable) {
        setFocusedButtonId(buttonId)
      }
    },
    [setFocusedButtonId, getButtonAvailability]
  )

  return (
    <>
      <Slate editor={editor} initialValue={parsedContent} onChange={handleChange}>
        {!disabledEditor && (
          <div ref={toolbarRef} className={styles.toolbar} role="toolbar" aria-label="Text formatting toolbar" onKeyDown={handleToolbarKeyDown}>
            <div className={styles.buttonGroup}>
              <MarkButton format="bold" buttonId="bold" tabIndex={getTabIndex('bold')} onFocus={() => handleButtonFocus('bold')}>
                format_bold
              </MarkButton>
              <MarkButton format="italic" buttonId="italic" tabIndex={getTabIndex('italic')} onFocus={() => handleButtonFocus('italic')}>
                format_italic
              </MarkButton>
              <MarkButton format="strike" buttonId="strike" tabIndex={getTabIndex('strike')} onFocus={() => handleButtonFocus('strike')}>
                format_strikethrough
              </MarkButton>
            </div>
            <div className={styles.buttonGroup}>
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
            <div className={styles.buttonGroup}>
              <LinkButton onOpenModal={handleOpenLinkModal} buttonId="link" tabIndex={getTabIndex('link')} onFocus={() => handleButtonFocus('link')} />
            </div>
            <div className={styles.buttonGroupSpacer} />
            <div className={styles.buttonGroup}>
              <UndoButton buttonId="undo" tabIndex={getTabIndex('undo')} onFocus={() => handleButtonFocus('undo')} isUndoAvailable={isUndoAvailable} />
              <RedoButton buttonId="redo" tabIndex={getTabIndex('redo')} onFocus={() => handleButtonFocus('redo')} isRedoAvailable={isRedoAvailable} />
            </div>
          </div>
        )}
        <InputWrapper disabled={disabledEditor} readOnly={disabledEditor} size="auto" className="px-1 py-1">
          <Editable
            className={mergeClasses('relative whitespace-pre-wrap break-words', styles.editable)}
            readOnly={disabledEditor}
            placeholder={placeholder}
            autoFocus={autofocus}
            onKeyDown={handleKeyDown}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            renderPlaceholder={renderPlaceholder}
            disableDefaultStyles={true}
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
    </>
  )
}

// --- Renderers ---
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'link':
      return (
        <a {...attributes} href={element.url}>
          {children}
        </a>
      )
    default:
      return <p {...attributes}>{children}</p>
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.strike) children = <s>{children}</s>
  return <span {...attributes}>{children}</span>
}

export default SlateEditor
