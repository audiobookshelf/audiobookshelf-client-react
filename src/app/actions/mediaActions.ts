'use server'

import * as api from '@/lib/api'
import { RssPodcastEpisode, UpdateLibraryItemMediaPayload } from '@/types/api'

export async function toggleFinishedAction(libraryItemId: string, params: { isFinished: boolean; episodeId?: string }) {
  return api.updateMediaFinished(libraryItemId, params)
}

export async function batchUpdateMediaFinishedAction(payload: { libraryItemId: string; episodeId?: string; isFinished: boolean }[]) {
  return api.batchUpdateMediaFinished(payload)
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

export async function deleteLibraryItemMediaEpisodeAction(libraryItemId: string, episodeId: string, hardDelete = false) {
  return api.deleteLibraryItemMediaEpisode(libraryItemId, episodeId, hardDelete)
}

export async function fetchPodcastFeedAction(rssFeed: string) {
  return api.fetchPodcastFeed(rssFeed)
}

export async function downloadPodcastEpisodesAction(libraryItemId: string, episodes: RssPodcastEpisode[]) {
  return api.downloadPodcastEpisodes(libraryItemId, episodes)
}

export async function clearPodcastDownloadQueueAction(libraryItemId: string) {
  return api.clearPodcastDownloadQueue(libraryItemId)
}
