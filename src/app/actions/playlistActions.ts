'use server'

import * as api from '@/lib/api'

/**
 * Delete a playlist
 */
export async function deletePlaylistAction(playlistId: string): Promise<void> {
  return api.deletePlaylist(playlistId)
}

