'use client'

import React, { memo, useCallback, useMemo } from 'react'
import { Editor } from 'slate'
import { useSlate } from 'slate-react'

import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import { CustomText } from '@/types/slate'
import { buttonClassBase } from './constants'

// --- Helper Functions ---

export const isMarkActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
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

export const toggleMark = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
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

// --- MarkButton Component ---

export const MarkButton = memo(
  ({ children, buttonId, tabIndex, onFocus }: { children: React.ReactNode; buttonId: string; tabIndex: number; onFocus: () => void }) => {
    const editor = useSlate()

    // Derive format from buttonId
    const format = buttonId as keyof Omit<CustomText, 'text'>

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

MarkButton.displayName = 'MarkButton'
