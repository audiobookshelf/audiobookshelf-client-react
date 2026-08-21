import { getLibraryItem } from '@/lib/api'
import { ApiError } from '@/lib/apiErrors'
import { isNextNotFoundError } from '@/lib/nextErrors'
import type { LibraryItem } from '@/types/api'
import { notFound } from 'next/navigation'

/**
 * Fetch helpers that call `notFound()` when a resource is missing.
 */

export async function getLibraryItemOrNotFound(itemId: string, expanded?: boolean, include?: string): Promise<LibraryItem> {
  try {
    const libraryItem = await getLibraryItem(itemId, expanded, include)
    if (!libraryItem) notFound()
    return libraryItem
  } catch (error) {
    if (isNextNotFoundError(error)) throw error
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}
