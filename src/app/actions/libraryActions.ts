'use server'

import { getLibraryFilterData, getLibraryItems } from '@/lib/api'

export async function fetchLibraryItemsAction(libraryId: string, query: string) {
  return getLibraryItems(libraryId, query)
}

export async function fetchLibraryFilterDataAction(libraryId: string) {
  return getLibraryFilterData(libraryId)
}
