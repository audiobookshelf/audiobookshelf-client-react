'use client'

import { useCallback, useEffect, useState } from 'react'

export type CompilationDisplayMode = 'bookshelf' | 'list'

function isCompilationDisplayMode(value: unknown): value is CompilationDisplayMode {
  return value === 'bookshelf' || value === 'list'
}

export function useCompilationDisplayMode(storageKey: string, defaultMode: CompilationDisplayMode = 'bookshelf') {
  const [displayMode, setDisplayModeState] = useState<CompilationDisplayMode>(defaultMode)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved && isCompilationDisplayMode(saved)) {
        setDisplayModeState(saved)
      }
    } catch {
      // ignore
    }
    setHasMounted(true)
  }, [storageKey])

  useEffect(() => {
    if (!hasMounted) return
    try {
      localStorage.setItem(storageKey, displayMode)
    } catch {
      // ignore storage errors
    }
  }, [displayMode, hasMounted, storageKey])

  const setDisplayMode = useCallback((mode: CompilationDisplayMode) => {
    setDisplayModeState(mode)
  }, [])

  const toggleDisplayMode = useCallback(() => {
    setDisplayModeState((mode) => (mode === 'bookshelf' ? 'list' : 'bookshelf'))
  }, [])

  return { displayMode, setDisplayMode, toggleDisplayMode }
}
