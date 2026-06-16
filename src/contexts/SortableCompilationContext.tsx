'use client'

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

export type SortableCompilationKind = 'collection' | 'playlist'

export interface SortableCompilationContextType {
  /** Collection or playlist id, depending on {@link compilationKind}. */
  compilationId: string
  compilationKind: SortableCompilationKind
  /** Syncs local ordered state after a successful remove API call. */
  onItemRemoved?: (libraryItemId: string, episodeId?: string | null) => void
}

const SortableCompilationContext = createContext<SortableCompilationContextType | null>(null)

export function SortableCompilationProvider({ value, children }: { value: SortableCompilationContextType; children: ReactNode }) {
  return <SortableCompilationContext.Provider value={value}>{children}</SortableCompilationContext.Provider>
}

/** Returns null outside a sortable compilation tree (collection or playlist page). */
export function useSortableCompilation(): SortableCompilationContextType | null {
  return useContext(SortableCompilationContext)
}
