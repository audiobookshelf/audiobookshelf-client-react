'use server'

import * as api from '@/lib/api'
import type { Playlist, PlaylistItemPayload } from '@/types/api'

/**
 * Delete a playlist
 */
export async function deletePlaylistAction(playlistId: string): Promise<void> {
  return api.deletePlaylist(playlistId)
}

export async function createPlaylistAction(payload: {
  libraryId: string
  name: string
  description?: string | null
  items?: PlaylistItemPayload[]
}): Promise<Playlist> {
  return api.createPlaylist(payload)
}

export async function batchAddToPlaylistAction(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  return api.batchAddToPlaylist(playlistId, items)
}

export async function batchRemoveFromPlaylistAction(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  return api.batchRemoveFromPlaylist(playlistId, items)
}
