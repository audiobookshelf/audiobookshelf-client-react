'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { createEditor, Descendant, Editor, Transforms, Text, Element as SlateElement } from 'slate'
import { Slate, Editable, withReact, useSlate, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'

import InputWrapper from './InputWrapper'
import styles from './SlateEditor.module.css'
import IconBtn from '@/components/ui/IconBtn'
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

// --- Toolbar & Buttons ---

const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
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

const MarkButton = ({ format, children }: { format: keyof Omit<CustomText, 'text'>; children: React.ReactNode }) => {
  const editor = useSlate()
  return (
    <IconBtn
      size="small"
      className={mergeClasses(isMarkActive(editor, format) ? styles.activeButton : styles.toolbarButton, 'h-7')}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {children}
    </IconBtn>
  )
}

const BlockButton = ({ format, children }: { format: CustomElement['type']; children: React.ReactNode }) => {
  const editor = useSlate()
  return (
    <IconBtn
      className={mergeClasses(isBlockActive(editor, format) ? styles.activeButton : styles.toolbarButton, 'h-7')}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      {children}
    </IconBtn>
  )
}

const UndoButton = () => {
  const editor = useSlate() as Editor & HistoryEditor
  const isUndoAvailable = editor.history.undos.length > 0

  return (
    <IconBtn
      className={mergeClasses(styles.toolbarButton, 'h-7')}
      disabled={!isUndoAvailable}
      onMouseDown={(event) => {
        event.preventDefault()
        editor.undo()
      }}
    >
      undo
    </IconBtn>
  )
}

const RedoButton = () => {
  const editor = useSlate() as Editor & HistoryEditor
  const isRedoAvailable = editor.history.redos.length > 0

  return (
    <IconBtn
      className={mergeClasses(styles.toolbarButton, 'h-7')}
      disabled={!isRedoAvailable}
      onMouseDown={(event) => {
        event.preventDefault()
        editor.redo()
      }}
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

// --- The Main Slate Component ---

const initialValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]

interface SlateEditorProps {
  srcContent?: string
  onUpdate?: (html: string) => void
  placeholder?: string
  disabledEditor?: boolean
  autofocus?: boolean
}

const SlateEditor = ({ srcContent = '', onUpdate, placeholder, disabledEditor = false, autofocus = false }: SlateEditorProps) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Parse srcContent on client side
  const [parsedContent, setParsedContent] = useState<Descendant[] | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (srcContent && srcContent.trim() !== '') {
        const document = new DOMParser().parseFromString(srcContent, 'text/html')
        const parsedValue = (deserialize(document.body) as Descendant[]) || initialValue
        setParsedContent(parsedValue)
      } else {
        setParsedContent(initialValue)
      }
    }
  }, [srcContent])

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      if (onUpdate) {
        const html = newValue.map(serialize).join('')
        onUpdate(html)
      }
    },
    [onUpdate]
  )

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

  // Don't render until we're ready
  if (parsedContent === null) {
    return null
  }

  return (
    <Slate editor={editor} initialValue={parsedContent} onChange={handleChange}>
      {!disabledEditor && (
        <div className={styles.toolbar}>
          <div className={styles.buttonGroup}>
            <MarkButton format="bold">format_bold</MarkButton>
            <MarkButton format="italic">format_italic</MarkButton>
            <MarkButton format="strike">format_strikethrough</MarkButton>
          </div>
          <div className={styles.buttonGroup}>
            <BlockButton format="bulleted-list">format_list_bulleted</BlockButton>
            <BlockButton format="numbered-list">format_list_numbered</BlockButton>
          </div>
          <div className={styles.buttonGroupSpacer} />
          <div className={styles.buttonGroup}>
            <UndoButton />
            <RedoButton />
          </div>
        </div>
      )}
      <InputWrapper disabled={disabledEditor} readOnly={disabledEditor} size="auto" className="px-1 py-1">
        <Editable
          className={styles.editable}
          readOnly={disabledEditor}
          placeholder={placeholder}
          autoFocus={autofocus}
          onKeyDown={handleKeyDown}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          renderPlaceholder={renderPlaceholder}
        />
      </InputWrapper>
    </Slate>
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
