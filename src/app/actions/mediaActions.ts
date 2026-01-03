'use server'

import * as api from '@/lib/api'
import { UpdateLibraryItemMediaPayload } from '@/types/api'

export async function toggleFinishedAction(libraryItemId: string, params: { isFinished: boolean; episodeId?: string }) {
  return api.updateMediaFinished(libraryItemId, params)
}

export async function updateLibraryItemMediaAction(libraryItemId: string, payload: UpdateLibraryItemMediaPayload) {
  return api.updateLibraryItemMedia(libraryItemId, payload)
}

export async function rescanLibraryItemAction(libraryItemId: string) {
  return api.rescanLibraryItem(libraryItemId)
}

export async function sendEbookToDeviceAction(payload: { libraryItemId: string; deviceName: string }) {
  return api.sendEbookToDevice(payload)
}

export async function removeSeriesFromContinueListeningAction(seriesId: string) {
  return api.removeSeriesFromContinueListening(seriesId)
}

export async function removeFromContinueListeningAction(progressId: string) {
  return api.removeFromContinueListening(progressId)
}

export async function deleteLibraryItemAction(libraryItemId: string, hardDelete: boolean) {
  return api.deleteLibraryItem(libraryItemId, hardDelete)
}

export async function getExpandedLibraryItemAction(libraryItemId: string) {
  return api.getLibraryItem(libraryItemId, true)
}
