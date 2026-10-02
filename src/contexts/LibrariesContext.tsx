'use client'

import { getCoverAspectRatio as coverAspectRatioFromSetting } from '@/lib/coverUtils'
import { Library } from '@/types/api'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface LibrariesContextValue {
  /** Numeric cover ratio for one library. Missing libraries use the standard 1.6 ratio. */
  getCoverAspectRatio: (libraryId: string) => number
  setLibraries: (libraries: Library[]) => void
}

const LibrariesContext = createContext<LibrariesContextValue | undefined>(undefined)

function coverAspectKey(libraries: { id: string; settings?: { coverAspectRatio?: 0 | 1 } }[]) {
  return libraries.map((library) => `${library.id}:${library.settings?.coverAspectRatio ?? ''}`).join('|')
}

export function LibrariesProvider({ children, initialLibraries }: { children: ReactNode; initialLibraries: Library[] }) {
  const [libraries, setLibrariesState] = useState(initialLibraries)

  const setLibraries = useCallback((next: Library[]) => {
    setLibrariesState((prev) => (coverAspectKey(prev) === coverAspectKey(next) ? prev : next))
  }, [])

  useEffect(() => {
    setLibraries(initialLibraries)
  }, [initialLibraries, setLibraries])

  const aspectById = useMemo(() => {
    const ratios = new Map<string, 0 | 1 | undefined>()
    for (const library of libraries) {
      ratios.set(library.id, library.settings?.coverAspectRatio)
    }
    return ratios
  }, [libraries])

  const getCoverAspectRatio = useCallback((libraryId: string) => coverAspectRatioFromSetting(aspectById.get(libraryId)), [aspectById])

  const value = useMemo(
    () => ({
      getCoverAspectRatio,
      setLibraries
    }),
    [getCoverAspectRatio, setLibraries]
  )

  return <LibrariesContext.Provider value={value}>{children}</LibrariesContext.Provider>
}

export function useLibraries(): LibrariesContextValue {
  const context = useContext(LibrariesContext)
  if (!context) {
    throw new Error('useLibraries must be used within a LibrariesProvider')
  }
  return context
}
