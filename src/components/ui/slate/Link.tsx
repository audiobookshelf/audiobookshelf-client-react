'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { Editor, Element, Range, Transforms, NodeEntry } from 'slate'
import { useSlate } from 'slate-react'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import { CustomElement } from '@/types/slate'
import { buttonClassBase } from './constants'

// --- Link Helper Functions ---

export const isLinkActive = (editor: Editor) => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
  })
  return !!match
}

export const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'link'
  })
}

export const getSelectedText = (editor: Editor): string => {
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

export const getLinkUrl = (editor: Editor): string => {
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

export const getActiveLinkEntry = (editor: Editor): NodeEntry<Element> | undefined => {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return
  const entry = Editor.above(editor, {
    at: selection,
    match: (n) => Element.isElement(n) && n.type === 'link'
  }) as NodeEntry<Element> | undefined
  return entry
}

export const upsertLink = (editor: Editor, text: string, url: string) => {
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

// --- LinkButton Component ---

interface LinkButtonProps {
  onOpenModal: () => void
}

export const LinkButton = memo(
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
