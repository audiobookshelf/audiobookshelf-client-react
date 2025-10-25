'use client'

import { createContext, useContext, useMemo, useState } from 'react'

interface LibraryItemsContextType {
  itemCount: number
  setItemCount: (count: number) => void
}

const LibraryItemsContext = createContext<LibraryItemsContextType | undefined>(undefined)

export function LibraryItemsProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0)

  const value = useMemo(
    () => ({
      itemCount,
      setItemCount
    }),
    [itemCount]
  )

  return <LibraryItemsContext.Provider value={value}>{children}</LibraryItemsContext.Provider>
}

export function useLibraryItems() {
  const context = useContext(LibraryItemsContext)
  if (context === undefined) {
    throw new Error('useLibraryItems must be used within a LibraryItemsProvider')
  }
  return context
}
