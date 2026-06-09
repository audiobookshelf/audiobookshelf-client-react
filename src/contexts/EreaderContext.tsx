'use client'

import EreaderOverlay from '@/components/ereader/EreaderOverlay'
import { useUser } from '@/contexts/UserContext'
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export interface OpenEreaderParams {
  libraryItemId: string
  title: string
  ebookFormat: string
  epubsAllowScriptedContent: boolean
}

interface EreaderSession extends OpenEreaderParams {
  /** Snapshot at open time so progress saves do not re-trigger the reader. */
  savedEbookLocation?: string
  savedEbookProgress?: number
}

interface EreaderContextType {
  openEreader: (params: OpenEreaderParams) => void
  closeEreader: () => void
}

const EreaderContext = createContext<EreaderContextType | undefined>(undefined)

export function EreaderProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [session, setSession] = useState<EreaderSession | null>(null)

  const openEreader = useCallback(
    (params: OpenEreaderParams) => {
      const progress = user.mediaProgress.find((p) => p.libraryItemId === params.libraryItemId)
      setSession({
        ...params,
        savedEbookLocation: progress?.ebookLocation,
        savedEbookProgress: progress?.ebookProgress
      })
    },
    [user.mediaProgress]
  )

  const closeEreader = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      openEreader,
      closeEreader
    }),
    [openEreader, closeEreader]
  )

  return (
    <EreaderContext.Provider value={value}>
      {children}
      {session && (
        <EreaderOverlay
          isOpen
          libraryItemId={session.libraryItemId}
          title={session.title}
          ebookFormat={session.ebookFormat}
          epubsAllowScriptedContent={session.epubsAllowScriptedContent}
          savedEbookLocation={session.savedEbookLocation}
          savedEbookProgress={session.savedEbookProgress}
          onClose={closeEreader}
        />
      )}
    </EreaderContext.Provider>
  )
}

export function useEreader() {
  const context = useContext(EreaderContext)
  if (context === undefined) {
    throw new Error('useEreader must be used within an EreaderProvider')
  }
  return context
}
