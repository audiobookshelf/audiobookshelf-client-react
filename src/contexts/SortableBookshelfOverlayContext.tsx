'use client'

import type { LibraryItem } from '@/types/api'
import { isBookMedia } from '@/types/api'
import { createContext, useContext, type ReactNode } from 'react'

/**
 * - `hover`: overlay follows pointer hover; full play/read/edit chrome when shown.
 * - `pinned`: touch sortable shelf — overlay stays visible without hover; only drag handle is displayed.
 * - `drag`: dnd-kit `DragOverlay` clone while dragging — currently identical to `pinned`.
 */
export type SortableBookshelfOverlayMode = 'hover' | 'pinned' | 'drag'

export interface SortableBookshelfOverlayContextType {
  overlayMode: SortableBookshelfOverlayMode
}

/** Pinned/minimal overlay: play/read/edit hidden (`pinned` or `drag`). */
export function isDragOnlyOverlay(mode: SortableBookshelfOverlayMode | undefined): boolean {
  return mode === 'pinned' || mode === 'drag'
}

/** Same ordering rules as the sortable book card host (ebooks omit duration sort). */
export function getSortableBookshelfItemOrderBy(libraryItem: LibraryItem): string | undefined {
  const media = libraryItem.media
  const isEbook = isBookMedia(media) && (!!media.ebookFormat || !!media.ebookFile)
  return isEbook ? undefined : 'media.duration'
}

const SortableBookshelfOverlayContext = createContext<SortableBookshelfOverlayContextType | null>(null)

export function SortableBookshelfOverlayProvider({
  overlayMode,
  children
}: {
  overlayMode: SortableBookshelfOverlayMode
  children: ReactNode
}) {
  return <SortableBookshelfOverlayContext.Provider value={{ overlayMode }}>{children}</SortableBookshelfOverlayContext.Provider>
}

/** Returns null outside a sortable bookshelf overlay tree. */
export function useSortableBookshelfOverlay(): SortableBookshelfOverlayContextType | null {
  return useContext(SortableBookshelfOverlayContext)
}
