'use server'

import * as api from '@/lib/api'
import type { PlaybackSession, StartSessionPayload } from '@/types/api'

interface SessionSyncData {
  currentTime: number
  timeListened: number
}

/**
 * Start a playback session for a library item
 * @param libraryItemId
 * @param payload - Session configuration
 * @param episodeId - Optional episode ID for podcasts
 */
export async function startPlaybackSession(libraryItemId: string, payload: StartSessionPayload, episodeId?: string): Promise<PlaybackSession> {
  const path = episodeId ? `/api/items/${libraryItemId}/play/${episodeId}` : `/api/items/${libraryItemId}/play`

  return api.apiRequest<PlaybackSession>(path, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

/**
 * Sync playback progress with the server
 * @param sessionId
 * @param syncData - Current time and listening time data
 */
export async function syncPlaybackSession(sessionId: string, syncData: SessionSyncData): Promise<void> {
  await api.apiRequest<void>(`/api/session/${sessionId}/sync`, {
    method: 'POST',
    body: JSON.stringify(syncData)
  })
}

/**
 * Close a playback session
 * @param sessionId
 * @param syncData - Optional final sync data (null if no progress to save)
 */
export async function closePlaybackSession(sessionId: string, syncData: SessionSyncData | null): Promise<void> {
  await api.apiRequest<void>(`/api/session/${sessionId}/close`, {
    method: 'POST',
    body: syncData ? JSON.stringify(syncData) : undefined
  })
}
