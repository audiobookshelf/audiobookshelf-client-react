'use client'

import { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { BookshelfView } from '@/types/api'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface LibraryContextType {
  itemCount: number
  setItemCount: (count: number) => void
  contextMenuItems: ContextMenuDropdownItem[]
  setContextMenuItems: (items: ContextMenuDropdownItem[]) => void
  onContextMenuAction: ((action: string) => void) | undefined
  setContextMenuActionHandler: (handler: (action: string) => void) => void
  bookshelfView: BookshelfView
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children, bookshelfView }: { children: React.ReactNode; bookshelfView: BookshelfView }) {
  const [itemCount, setItemCount] = useState(0)
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuDropdownItem[]>([])
  const [onContextMenuAction, setOnContextMenuActionState] = useState<((action: string) => void) | undefined>(undefined)

  const setContextMenuActionHandler = useCallback((handler: (action: string) => void) => {
    setOnContextMenuActionState(() => handler)
  }, [])

  const value = useMemo(
    () => ({
      itemCount,
      setItemCount,
      contextMenuItems,
      setContextMenuItems,
      onContextMenuAction,
      setContextMenuActionHandler,
      bookshelfView
    }),
    [itemCount, contextMenuItems, onContextMenuAction, setContextMenuActionHandler, bookshelfView]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider')
  }
  return context
}
