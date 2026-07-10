'use client'

import type { SortableCompilationContextType, SortableCompilationKind } from '@/contexts/SortableCompilationContext'
import { usePrimaryInputCanHover } from '@/hooks/useMediaQuery'
import type { SortableBookshelfOverlayMode } from '@/contexts/SortableBookshelfOverlayContext'
import { useUser } from '@/contexts/UserContext'
import { useMemo } from 'react'

export function useCompilationSortableContext(
  compilationId: string,
  compilationKind: SortableCompilationKind,
  mobileReorderActive: boolean,
  onItemRemoved: (libraryItemId: string, episodeId?: string | null) => void
) {
  const { userCanUpdate } = useUser()
  const primaryInputCanHover = usePrimaryInputCanHover()

  const showReorder = userCanUpdate && (primaryInputCanHover || mobileReorderActive)

  const sortableCompilation = useMemo((): SortableCompilationContextType => {
    return {
      compilationId,
      compilationKind,
      onItemRemoved
    }
  }, [compilationId, compilationKind, onItemRemoved])

  const bookshelfOverlayMode: SortableBookshelfOverlayMode = showReorder && !primaryInputCanHover ? 'pinned' : 'hover'

  return { showReorder, sortableCompilation, bookshelfOverlayMode }
}
