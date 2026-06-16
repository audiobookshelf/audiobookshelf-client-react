'use server'

import * as api from '@/lib/api'
import type { Playlist, PlaylistItemPayload } from '@/types/api'
import { revalidatePath } from 'next/cache'

function revalidatePlaylistDetailPage(playlist: Pick<Playlist, 'libraryId' | 'id'>) {
  const { libraryId, id } = playlist
  if (!libraryId || !id) return
  revalidatePath(`/library/${libraryId}/playlist/${id}`)
}

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
  const created = await api.createPlaylist(payload)
  revalidatePlaylistDetailPage(created)
  return created
}

export async function batchAddToPlaylistAction(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  const updated = await api.batchAddToPlaylist(playlistId, items)
  revalidatePlaylistDetailPage(updated)
  return updated
}

export async function batchRemoveFromPlaylistAction(playlistId: string, items: PlaylistItemPayload[]): Promise<Playlist> {
  const updated = await api.batchRemoveFromPlaylist(playlistId, items)
  revalidatePlaylistDetailPage(updated)
  return updated
}

export async function updatePlaylistAction(
  playlistId: string,
  payload: {
    name?: string
    description?: string | null
    items?: PlaylistItemPayload[]
  }
): Promise<Playlist> {
  const updated = await api.updatePlaylist(playlistId, payload)
  revalidatePlaylistDetailPage(updated)
  return updated
}
