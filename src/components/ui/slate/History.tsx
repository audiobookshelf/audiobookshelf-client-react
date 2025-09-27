'use client'

import React, { memo, useCallback } from 'react'
import { Editor } from 'slate'
import { HistoryEditor } from 'slate-history'
import { useSlate } from 'slate-react'

import IconBtn from '@/components/ui/IconBtn'
import { buttonClassBase } from './constants'

// --- UndoButton Component ---

export const UndoButton = memo(
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

UndoButton.displayName = 'UndoButton'

// --- RedoButton Component ---

export const RedoButton = memo(
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

RedoButton.displayName = 'RedoButton'
