'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { applyLibraryItemUpdateToPlaylistItems } from '@/lib/libraryItemUpdatedUtils'
import { getDurationSupplementLabel, getMediaItemProgress } from '@/lib/mediaProgress'
import { getPlaylistItemDuration, matchesPlaylistItem } from '@/lib/playlistItems'
import type { Playlist, PlaylistItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function usePlaylistItems(playlist: Playlist) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { setItemCount, setItemCountSupplement } = useLibrary()
  const { user } = useUser()

  const serverItemKeys = useMemo(() => (playlist.items ?? []).map((i) => `${i.libraryItemId}:${i.episodeId ?? ''}`).join(','), [playlist.items])

  const [orderedItems, setOrderedItems] = useState<PlaylistItem[]>(() => playlist.items ?? [])

  const handleItemRemoved = useCallback(
    (libraryItemId: string, episodeId?: string | null) => {
      let removedLastItem = false
      setOrderedItems((prev) => {
        const next = prev.filter((item) => !matchesPlaylistItem(item, libraryItemId, episodeId))
        removedLastItem = prev.length > 0 && next.length === 0
        return next
      })
      // Backend deletes playlists with no items left — navigate away instead of refreshing a dead page.
      if (removedLastItem) {
        router.push(`/library/${playlist.libraryId}/playlists`)
      } else {
        router.refresh()
      }
    },
    [playlist.libraryId, router]
  )

  useEffect(() => {
    setOrderedItems(playlist.items ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverItemKeys reflects playlist.items order and membership
  }, [playlist.id, serverItemKeys])

  useLibraryItemUpdated(
    playlist.libraryId,
    useCallback((updatedItem) => {
      setOrderedItems((prev) => applyLibraryItemUpdateToPlaylistItems(prev, updatedItem))
    }, [])
  )

  const totalEntities = orderedItems.length

  const totalDurationSeconds = useMemo(() => {
    let sum = 0
    for (const item of orderedItems) {
      sum += getPlaylistItemDuration(item)
    }
    return sum
  }, [orderedItems])

  const totalListenedSeconds = useMemo(() => {
    let sum = 0
    for (const item of orderedItems) {
      const duration = getPlaylistItemDuration(item)
      const progress = getMediaItemProgress(user.mediaProgress, item.libraryItemId, item.episodeId)
      if (!progress) continue
      sum += progress.isFinished ? duration : progress.currentTime || 0
    }
    return sum
  }, [orderedItems, user.mediaProgress])

  const itemCountSupplementLabel = useMemo(
    () => getDurationSupplementLabel(totalDurationSeconds, totalListenedSeconds, t),
    [totalDurationSeconds, totalListenedSeconds, t]
  )

  useEffect(() => {
    setItemCount(totalEntities)
    setItemCountSupplement(itemCountSupplementLabel)
    return () => {
      setItemCount(null)
    }
  }, [totalEntities, itemCountSupplementLabel, setItemCount, setItemCountSupplement])

  return {
    orderedItems,
    setOrderedItems,
    handleItemRemoved
  }
}
