'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface CollectionBookshelfContext {
  collectionId: string
  onBookRemovedFromCollection?: (libraryItemId: string) => void
}

const collectionBookshelfReactContext = createContext<CollectionBookshelfContext | null>(null)

export function CollectionBookshelfProvider({
  value,
  children
}: {
  value: CollectionBookshelfContext
  children: ReactNode
}) {
  return <collectionBookshelfReactContext.Provider value={value}>{children}</collectionBookshelfReactContext.Provider>
}

/** Returns null outside a collection bookshelf tree. */
export function useOptionalCollectionBookshelf(): CollectionBookshelfContext | null {
  return useContext(collectionBookshelfReactContext)
}
