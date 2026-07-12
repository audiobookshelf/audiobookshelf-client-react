type TextSelectionEvent = {
  shiftKey: boolean
  preventDefault: () => void
}

/** Clears any browser text selection highlight. */
function clearDocumentTextSelection() {
  if (typeof window === 'undefined') return
  window.getSelection()?.removeAllRanges()
}

/**
 * Stops the browser from extending a text selection on shift-click range select.
 * Call from `mousedown` / `pointerdown` before the click handler runs.
 */
export function preventShiftClickTextSelection(event: TextSelectionEvent, options?: { selectionActive?: boolean }) {
  const { selectionActive = false } = options ?? {}
  if (!event.shiftKey && !selectionActive) return

  event.preventDefault()
  clearDocumentTextSelection()
}

export interface ShiftClickSelectionParams {
  prevSelected: Set<string>
  clickedKey: string
  clickedIndex: number
  shiftKey: boolean
  anchorKey: string | null
  /** Item keys in current display order (filter + sort). */
  orderedKeys: readonly string[]
  /** Desired selection state for the clicked item when not range-selecting. */
  selectClicked: boolean
  /** When false, the key is skipped during shift-range operations. */
  isKeySelectable?: (key: string) => boolean
}

export interface ShiftClickSelectionResult {
  nextSelected: Set<string>
  anchorKey: string | null
}

/**
 * Applies single-click or shift-click range selection over an ordered list.
 * Range behavior matches LazyBookshelf: if any selectable item in the range is
 * unselected, select all selectable items in the range; otherwise deselect them.
 */
export function applyShiftClickSelection({
  prevSelected,
  clickedKey,
  clickedIndex,
  shiftKey,
  anchorKey,
  orderedKeys,
  selectClicked,
  isKeySelectable = () => true
}: ShiftClickSelectionParams): ShiftClickSelectionResult {
  const next = new Set(prevSelected)

  const anchorIndex = anchorKey ? orderedKeys.indexOf(anchorKey) : -1

  let result: ShiftClickSelectionResult

  if (shiftKey && anchorIndex >= 0 && clickedIndex >= 0 && clickedIndex < orderedKeys.length) {
    const loopStart = Math.min(clickedIndex, anchorIndex)
    const loopEnd = Math.max(clickedIndex, anchorIndex)

    let isSelecting = false
    for (let i = loopStart; i <= loopEnd; i++) {
      const key = orderedKeys[i]
      if (!isKeySelectable(key)) continue
      if (!next.has(key)) {
        isSelecting = true
        break
      }
    }

    for (let i = loopStart; i <= loopEnd; i++) {
      const key = orderedKeys[i]
      if (!isKeySelectable(key)) continue
      if (isSelecting) {
        next.add(key)
      } else {
        next.delete(key)
      }
    }

    result = {
      nextSelected: next,
      anchorKey: isSelecting ? clickedKey : null
    }
  } else if (selectClicked) {
    next.add(clickedKey)
    result = { nextSelected: next, anchorKey: clickedKey }
  } else {
    next.delete(clickedKey)
    result = { nextSelected: next, anchorKey: null }
  }

  if (shiftKey) {
    clearDocumentTextSelection()
  }

  return result
}
