'use server'

import * as api from '@/lib/api'
import type { PlaybackSession, StartSessionPayload } from '@/types/api'
import { headers } from 'next/headers'

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

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  return api.apiRequest<PlaybackSession>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'User-Agent': userAgent
    }
  })
}

/**
 * Sync playback progress with the server
 * @param sessionId
 * @param syncData - Current time and listening time data
 */
export async function syncPlaybackSession(sessionId: string, syncData: SessionSyncData): Promise<void> {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  await api.apiRequest<void>(`/api/session/${sessionId}/sync`, {
    method: 'POST',
    body: JSON.stringify(syncData),
    headers: {
      'User-Agent': userAgent
    }
  })
}

/**
 * Close a playback session
 * @param sessionId
 * @param syncData - Optional final sync data (null if no progress to save)
 */
export async function closePlaybackSession(sessionId: string, syncData: SessionSyncData | null): Promise<void> {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  await api.apiRequest<void>(`/api/session/${sessionId}/close`, {
    method: 'POST',
    body: syncData ? JSON.stringify(syncData) : undefined,
    headers: {
      'User-Agent': userAgent
    }
  })
}
