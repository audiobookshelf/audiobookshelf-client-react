'use client'

import { preventShiftClickTextSelection } from '@/lib/shiftClickSelection'
import { useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

export interface UseShiftClickTextSelectionGuardOptions {
  /** When false, no handlers or classes are returned. */
  enabled?: boolean
  /** When true, suppresses text selection even without shift (multi-select mode). */
  selectionActive?: boolean
}

/**
 * Returns pointer handlers and a flag for `select-none` to prevent browser text
 * selection during shift-click range multi-select.
 */
export function useShiftClickTextSelectionGuard({ enabled = true, selectionActive = false }: UseShiftClickTextSelectionGuardOptions = {}) {
  const suppressTextSelection = enabled && selectionActive

  const guardPointerEvent = useCallback(
    (event: { shiftKey: boolean; preventDefault: () => void }) => {
      if (!enabled) return
      preventShiftClickTextSelection(event, { selectionActive })
    },
    [enabled, selectionActive]
  )

  const onMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      guardPointerEvent(event)
    },
    [guardPointerEvent]
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      guardPointerEvent(event)
    },
    [guardPointerEvent]
  )

  return {
    onMouseDown: enabled ? onMouseDown : undefined,
    onPointerDown: enabled ? onPointerDown : undefined,
    suppressTextSelection
  }
}
