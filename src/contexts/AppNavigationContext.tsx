'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface AppNavigationContextValue {
  lastCurrentLibraryId: string | null
  setLastCurrentLibraryId: (libraryId: string) => void
  lastNonSettingsPath: string | null
}

const AppNavigationContext = createContext<AppNavigationContextValue | undefined>(undefined)

function isSettingsPath(pathname: string): boolean {
  return pathname === '/settings' || pathname.startsWith('/settings/')
}

function LastNonSettingsPathTracker({ onPathChange }: { onPathChange: (path: string) => void }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!isSettingsPath(pathname)) {
      onPathChange(pathname)
    }
  }, [onPathChange, pathname])

  return null
}

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const [lastCurrentLibraryId, setLastCurrentLibraryId] = useState<string | null>(null)
  const [lastNonSettingsPath, setLastNonSettingsPath] = useState<string | null>(null)

  const value = useMemo(
    (): AppNavigationContextValue => ({
      lastCurrentLibraryId,
      setLastCurrentLibraryId,
      lastNonSettingsPath
    }),
    [lastCurrentLibraryId, lastNonSettingsPath]
  )

  return (
    <AppNavigationContext.Provider value={value}>
      <LastNonSettingsPathTracker onPathChange={setLastNonSettingsPath} />
      {children}
    </AppNavigationContext.Provider>
  )
}

export function useAppNavigation(): AppNavigationContextValue {
  const ctx = useContext(AppNavigationContext)
  if (!ctx) {
    throw new Error('useAppNavigation must be used within an AppNavigationProvider')
  }
  return ctx
}
