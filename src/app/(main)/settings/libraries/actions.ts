'use server'

import * as api from '@/lib/api'
import { GetFilesystemPathsResponse, Library, SaveLibraryOrderApiResponse } from '@/types/api'
import { revalidatePath } from 'next/cache'

export async function createLibrary(newLibrary: Library): Promise<Library> {
  const result = await api.createLibrary(newLibrary)
  revalidatePath('/settings/libraries')
  return result
}

export async function editLibrary(libraryId: string, updatedLibrary: Library): Promise<Library> {
  const result = await api.updateLibrary(libraryId, updatedLibrary)
  revalidatePath('/settings/libraries')
  return result
}

export async function deleteLibrary(libraryId: string): Promise<Library> {
  const result = await api.deleteLibrary(libraryId)
  revalidatePath('/settings/libraries')
  return result
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

export async function getFilesystemPaths(path: string, level: number): Promise<GetFilesystemPathsResponse> {
  return api.getFilesystemPaths(path, level)
}
