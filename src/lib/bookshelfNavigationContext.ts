import type { BookshelfEntity } from '@/types/api'

/**
 * Generic prev/next scope for modals.
 * `entityIds` is ordered; `initialIndex` selects the active entity when the modal opens.
 */
export type EntityNavigationContext = {
  entityIds: string[]
  initialIndex: number
}

/**
 * Prev/next entity scope for one bookshelf entity slot: contiguous non-null run around `entityIndex`, in array order.
 * Call when opening a modal (lazy). Returns a fresh `entityIds` array; safe to pass through to the modal.
 */
export function getEntityNavigationContext(entities: (BookshelfEntity | null)[], entityIndex: number): EntityNavigationContext | null {
  if (entityIndex < 0 || entityIndex >= entities.length) return null

  const at = entities[entityIndex]
  if (at === null) return null

  let start = entityIndex
  while (start > 0 && entities[start - 1] !== null) {
    start--
  }

  let end = entityIndex
  while (end < entities.length - 1 && entities[end + 1] !== null) {
    end++
  }

  const entityIds: string[] = []
  let initialIndex = -1

  for (let j = start; j <= end; j++) {
    const e = entities[j]
    if (e === null) continue
    if (j === entityIndex) {
      initialIndex = entityIds.length
    }
    entityIds.push(e.id)
  }

  if (initialIndex < 0) return null

  return { entityIds, initialIndex }
}
