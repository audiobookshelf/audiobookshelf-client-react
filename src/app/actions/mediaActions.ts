'use server'

import * as api from '@/lib/api'
import { RssPodcastEpisode, UpdateLibraryItemMediaPayload, UpdatePodcastEpisodePayload, type BatchUpdateLibraryItemPayload } from '@/types/api'
import { revalidatePath } from 'next/cache'

function revalidateSeriesPage(libraryId: string, seriesId: string) {
  revalidatePath(`/library/${libraryId}/series/${seriesId}`)
}

export async function toggleFinishedAction(libraryItemId: string, params: { isFinished: boolean; episodeId?: string }) {
  return api.updateMediaFinished(libraryItemId, params)
}

export async function batchUpdateMediaFinishedAction(payload: { libraryItemId: string; episodeId?: string; isFinished: boolean }[]) {
  return api.batchUpdateMediaFinished(payload)
}

export async function markSeriesFinishedAction(libraryId: string, seriesId: string, payload: { libraryItemId: string; isFinished: boolean }[]) {
  await api.batchUpdateMediaFinished(payload)
  revalidateSeriesPage(libraryId, seriesId)
}

export async function updateLibraryItemMediaAction(libraryItemId: string, payload: UpdateLibraryItemMediaPayload) {
  return api.updateLibraryItemMedia(libraryItemId, payload)
}

export async function batchGetLibraryItemsAction(libraryItemIds: string[]) {
  return api.batchGetLibraryItems(libraryItemIds)
}

export async function batchUpdateLibraryItemsAction(payload: BatchUpdateLibraryItemPayload[]) {
  return api.batchUpdateLibraryItems(payload)
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

export async function readdSeriesToContinueListeningAction(seriesId: string) {
  return api.readdSeriesToContinueListening(seriesId)
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

export async function getPodcastEpisodeAction(libraryItemId: string, episodeId: string) {
  return api.getPodcastEpisode(libraryItemId, episodeId)
}

export async function updatePodcastEpisodeAction(libraryItemId: string, episodeId: string, payload: UpdatePodcastEpisodePayload) {
  return api.updatePodcastEpisode(libraryItemId, episodeId, payload)
}

export async function searchPodcastEpisodeAction(libraryItemId: string, title: string) {
  return api.searchPodcastEpisode(libraryItemId, title)
}
