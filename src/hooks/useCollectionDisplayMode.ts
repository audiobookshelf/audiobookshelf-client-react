'use client'

import { useCallback, useEffect, useState } from 'react'

export type CollectionDisplayMode = 'bookshelf' | 'list'

const STORAGE_KEY = 'collectionDisplayMode'
const DEFAULT_MODE: CollectionDisplayMode = 'bookshelf'

function isCollectionDisplayMode(value: unknown): value is CollectionDisplayMode {
  return value === 'bookshelf' || value === 'list'
}

export function useCollectionDisplayMode() {
  const [displayMode, setDisplayModeState] = useState<CollectionDisplayMode>(DEFAULT_MODE)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && isCollectionDisplayMode(saved)) {
        setDisplayModeState(saved)
      }
    } catch {
      // ignore
    }
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    try {
      localStorage.setItem(STORAGE_KEY, displayMode)
    } catch {
      // ignore storage errors
    }
  }, [displayMode, hasMounted])

  const setDisplayMode = useCallback((mode: CollectionDisplayMode) => {
    setDisplayModeState(mode)
  }, [])

  const toggleDisplayMode = useCallback(() => {
    setDisplayModeState((mode) => (mode === 'bookshelf' ? 'list' : 'bookshelf'))
  }, [])

  return { displayMode, setDisplayMode, toggleDisplayMode }
}
