import type { EpisodeNavigationContext } from '@/lib/episodeEditNavigation'
import { useCallback, useLayoutEffect, useState } from 'react'

/**
 * Tracks index into `navigation.slots` for episode modal prev/next; resets when the modal opens.
 */
export function useEpisodeNavigationContext(navigationContext: EpisodeNavigationContext | undefined, isOpen: boolean) {
  const slots = navigationContext?.slots ?? []
  const initialIndex = navigationContext?.initialIndex ?? 0

  const [navIndex, setNavIndex] = useState(initialIndex)

  useLayoutEffect(() => {
    if (isOpen) {
      setNavIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  const safeIndex = Math.min(Math.max(0, navIndex), Math.max(0, slots.length - 1))
  const currentSlot = slots.length > 0 ? slots[safeIndex]! : null
  const canGoPrev = slots.length > 0 && safeIndex > 0
  const canGoNext = slots.length > 0 && safeIndex < slots.length - 1

  const goPrev = useCallback(() => {
    setNavIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setNavIndex((i) => (i < slots.length - 1 ? i + 1 : i))
  }, [slots.length])

  return { currentSlot, canGoPrev, canGoNext, goPrev, goNext }
}
