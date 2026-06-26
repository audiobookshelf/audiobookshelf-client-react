'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { applyLibraryItemUpdateToPlaylistItems } from '@/lib/libraryItemUpdatedUtils'
import { getPlaylistItemDuration, matchesPlaylistItem } from '@/lib/playlistItems'
import type { Playlist, PlaylistItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function usePlaylistItems(playlist: Playlist) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { setItemCount, setItemCountSupplement } = useLibrary()

  const serverItemKeys = useMemo(() => (playlist.items ?? []).map((i) => `${i.libraryItemId}:${i.episodeId ?? ''}`).join(','), [playlist.items])

  const [orderedItems, setOrderedItems] = useState<PlaylistItem[]>(() => playlist.items ?? [])

  const handleItemRemoved = useCallback(
    (libraryItemId: string, episodeId?: string | null) => {
      setOrderedItems((prev) => prev.filter((item) => !matchesPlaylistItem(item, libraryItemId, episodeId)))
      router.refresh()
    },
    [router]
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

  const totalDurationLabel = totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds, t, { showDays: true }) : null

  useEffect(() => {
    setItemCount(totalEntities)
    setItemCountSupplement(totalDurationLabel ? ` (${totalDurationLabel})` : null)
    return () => {
      setItemCount(null)
    }
  }, [totalEntities, totalDurationLabel, setItemCount, setItemCountSupplement])

  return {
    orderedItems,
    setOrderedItems,
    handleItemRemoved
  }
}
