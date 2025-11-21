'use server'

import * as api from '@/lib/api'
import { Library, SaveLibraryOrderApiResponse } from '@/types/api'

export async function createLibrary(newLibrary: Library): Promise<Library> {
  return api.createLibrary(newLibrary)
}

export async function editLibrary(libraryId: string, updatedLibrary: Library): Promise<Library> {
  return api.updateLibrary(libraryId, updatedLibrary)
}

export async function deleteLibrary(libraryId: string): Promise<Library> {
  return api.deleteLibrary(libraryId)
}

export async function saveLibraryOrder(reorderObjects: { id: string; newOrder: number }[]): Promise<SaveLibraryOrderApiResponse> {
  return api.saveLibraryOrder(reorderObjects)
}

export async function requestScanLibrary(libraryId: string): Promise<void> {
  return api.scanLibrary(libraryId)
}

export async function matchAll(libraryId: string): Promise<void> {
  return api.matchAll(libraryId)
}
