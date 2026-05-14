'use client'

import type { LibraryItem } from '@/types/api'
import { isBookMedia } from '@/types/api'
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'

const HOVER_MEDIA_QUERY = '(hover: hover)'

function subscribeHoverMedia(onStoreChange: () => void) {
  const mq = window.matchMedia(HOVER_MEDIA_QUERY)
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

function getHoverMediaSnapshot() {
  return window.matchMedia(HOVER_MEDIA_QUERY).matches
}

/** SSR / first paint: assume hover-capable to match typical desktop layouts. */
function getHoverMediaServerSnapshot() {
  return true
}

/**
 * True when the primary input can hover (e.g. mouse / trackpad). False on touch-first UIs
 * (phones, most tablets) where `(hover: hover)` does not match.
 */
export function usePrimaryInputCanHover(): boolean {
  return useSyncExternalStore(subscribeHoverMedia, getHoverMediaSnapshot, getHoverMediaServerSnapshot)
}

/**
 * - `hover`: overlay follows pointer hover; full play/read/edit chrome when shown.
 * - `pinned`: touch sortable shelf — overlay stays visible without hover; only drag handle is displayed.
 * - `drag`: dnd-kit `DragOverlay` clone while dragging — currently identical to `pinned`.
 */
export type SortableBookshelfOverlayMode = 'hover' | 'pinned' | 'drag'

export type SortableListKind = 'collection' | 'playlist'

export interface SortableBookshelfContextType {
  /** Collection or playlist id, depending on {@link sortableListKind}. */
  sortableListId: string
  sortableListKind: SortableListKind
  onLibraryItemRemovedFromSortableList?: (libraryItemId: string) => void
  /** Overlay UX for sortable shelves: `pinned` on touch reorder grids; `hover` on desktop reorder. */
  overlayMode?: SortableBookshelfOverlayMode
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

const SortableBookshelfContext = createContext<SortableBookshelfContextType | null>(null)

export function SortableBookshelfProvider({ value, children }: { value: SortableBookshelfContextType; children: ReactNode }) {
  return <SortableBookshelfContext.Provider value={value}>{children}</SortableBookshelfContext.Provider>
}

/** Returns null outside a sortable bookshelf tree (collection, playlist, etc.). */
export function useSortableBookshelf(): SortableBookshelfContextType | null {
  return useContext(SortableBookshelfContext)
}
