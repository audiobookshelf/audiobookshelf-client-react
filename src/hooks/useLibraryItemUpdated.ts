'use client'

import { useSocketEvent } from '@/contexts/SocketContext'
import type { LibraryItem } from '@/types/api'
import { useCallback } from 'react'

/**
 * Listens for `item_updated` / `items_updated` and invokes `onItemUpdated` for items in the given library.
 */
export function useLibraryItemUpdated(libraryId: string, onItemUpdated: (updatedItem: LibraryItem) => void) {
  const handleItemUpdated = useCallback(
    (updatedItem: LibraryItem) => {
      if (updatedItem.libraryId !== libraryId) return
      onItemUpdated(updatedItem)
    },
    [libraryId, onItemUpdated]
  )

  const handleItemsUpdated = useCallback(
    (updatedItems: LibraryItem[]) => {
      for (const item of updatedItems) {
        if (item.libraryId === libraryId) {
          onItemUpdated(item)
        }
      }
    },
    [libraryId, onItemUpdated]
  )

  useSocketEvent<LibraryItem>('item_updated', handleItemUpdated, [handleItemUpdated])
  useSocketEvent<LibraryItem[]>('items_updated', handleItemsUpdated, [handleItemsUpdated])
}
