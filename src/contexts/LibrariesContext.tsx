'use client'

import { getLibrariesAction } from '@/app/actions/searchActions'
import { Library } from '@/types/api'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface LibrariesState {
  libraries: Library[]
  librariesLoaded: boolean
  isLoading: boolean
}

interface LibrariesContextType extends LibrariesState {
  ensureLibrariesLoaded: () => Promise<void>
  refreshLibraries: () => Promise<void>
}

const LibrariesContext = createContext<LibrariesContextType | undefined>(undefined)

export function LibrariesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LibrariesState>({
    libraries: [],
    librariesLoaded: false,
    isLoading: false
  })

  const fetchLibaries = useCallback(
    async (force = false) => {
      // Only fetch if not already loaded (unless forced)
      if (state.librariesLoaded && !force) {
        return
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await getLibrariesAction()

        if (result?.libraries) {
          setState({
            libraries: result.libraries || [],
            librariesLoaded: true,
            isLoading: false
          })
        }
      } catch (error) {
        console.error('Failed to fetch libraries:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [state.librariesLoaded]
  )

  const ensureLibrariesLoaded = useCallback(async () => {
    await fetchLibaries(false)
  }, [fetchLibaries])

  // Force refresh libraries (for socket events and manual refresh)
  const refreshLibraries = useCallback(async () => {
    // Only refresh if libraries were already loaded
    if (!state.librariesLoaded) {
      return
    }
    await fetchLibaries(true)
  }, [fetchLibaries, state.librariesLoaded])

  const value = useMemo(
    () => ({
      ...state,
      ensureLibrariesLoaded,
      refreshLibraries
    }),
    [state, ensureLibrariesLoaded, refreshLibraries]
  )

  return <LibrariesContext.Provider value={value}>{children}</LibrariesContext.Provider>
}

export function useLibraries() {
  const context = useContext(LibrariesContext)
  if (context === undefined) {
    throw new Error('useLibraries must be used within a LibraryProvider')
  }
  return context
}
