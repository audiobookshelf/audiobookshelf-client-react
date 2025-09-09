'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { Editor, Element, Transforms } from 'slate'
import { useSlate } from 'slate-react'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import { CustomElement } from '@/types/slate'
import { buttonClassBase } from './constants'

// --- Helper Functions ---

export const isBlockActive = (editor: Editor, format: CustomElement['type']) => {
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

export const toggleBlock = (editor: Editor, format: CustomElement['type']) => {
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

// --- BlockButton Component ---

export const BlockButton = memo(
  ({ children, buttonId, tabIndex, onFocus }: { children: React.ReactNode; buttonId: string; tabIndex: number; onFocus: () => void }) => {
    const editor = useSlate()

    // Derive format from buttonId
    const format = buttonId as CustomElement['type']

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
