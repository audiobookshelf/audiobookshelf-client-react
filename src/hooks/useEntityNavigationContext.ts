import type { EntityNavigationContext } from '@/lib/bookshelfNavigationContext'
import { useCallback, useLayoutEffect, useState } from 'react'

/**
 * Tracks index into `navigation.entityIds` for modal prev/next; resets when the modal opens.
 * Reset runs in a layout effect so consumers' layout effects see the correct index on open.
 * Pass `null` when there is no sequential scope (e.g. single-entity modal).
 */
export function useEntityNavigationContext(navigationContext: EntityNavigationContext | undefined, isOpen: boolean) {
  const entityIds = navigationContext?.entityIds ?? []
  const initialIndex = navigationContext?.initialIndex ?? 0

  const [navIndex, setNavIndex] = useState(initialIndex)

  useLayoutEffect(() => {
    if (isOpen) {
      setNavIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const safeIndex = Math.min(Math.max(0, navIndex), Math.max(0, entityIds.length - 1))
  const currentEntityId = entityIds.length > 0 ? entityIds[safeIndex]! : null
  const canGoPrev = entityIds.length > 0 && safeIndex > 0
  const canGoNext = entityIds.length > 0 && safeIndex < entityIds.length - 1

  const goPrev = useCallback(() => {
    setNavIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setNavIndex((i) => (i < entityIds.length - 1 ? i + 1 : i))
  }, [entityIds.length])

  return { currentEntityId, canGoPrev, canGoNext, goPrev, goNext }
}
