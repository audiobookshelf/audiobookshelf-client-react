'use client'

import { createContext, useContext, type ReactNode } from 'react'

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
