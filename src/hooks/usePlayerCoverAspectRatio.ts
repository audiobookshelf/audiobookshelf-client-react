'use client'

import { useLibraryOptional } from '@/contexts/LibraryContext'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { getRegisteredLibraryCoverAspectRatio } from '@/lib/player/libraryCoverAspectRatioRegistry'

/**
 * Cover aspect ratio for the player. The player renders outside LibraryProvider, so this
 * prefers the active library context when it matches `libraryId`, otherwise a registry
 * populated by library routes and settings.
 */
export function usePlayerCoverAspectRatio(libraryId: string): number {
  const { library } = useLibraryOptional()
  if (library?.id === libraryId) {
    return getCoverAspectRatio((library.settings?.coverAspectRatio ?? 0) as 0 | 1)
  }
  return getRegisteredLibraryCoverAspectRatio(libraryId)
}
