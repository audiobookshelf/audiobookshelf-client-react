'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryItemUpdated } from '@/hooks/useLibraryItemUpdated'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { applyLibraryItemUpdateToList } from '@/lib/libraryItemUpdatedUtils'
import { getMediaItemProgress } from '@/lib/mediaProgress'
import type { Collection, LibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function useCollectionBooks(collection: Collection) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { setItemCount, setItemCountSupplement } = useLibrary()
  const { user } = useUser()

  const serverBookIds = useMemo(() => (collection.books ?? []).map((b) => b.id).join(','), [collection.books])

  const [orderedBooks, setOrderedBooks] = useState<LibraryItem[]>(() => collection.books ?? [])

  const handleItemRemoved = useCallback(
    (libraryItemId: string) => {
      setOrderedBooks((prev) => prev.filter((b) => b.id !== libraryItemId))
      router.refresh()
    },
    [router]
  )

  useEffect(() => {
    setOrderedBooks(collection.books ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverBookIds reflects collection.books order and membership
  }, [collection.id, serverBookIds])

  useLibraryItemUpdated(
    collection.libraryId,
    useCallback((updatedItem) => {
      setOrderedBooks((prev) => applyLibraryItemUpdateToList(prev, updatedItem))
    }, [])
  )

  const totalEntities = orderedBooks.length

  const totalDurationSeconds = useMemo(() => {
    let sum = 0
    for (const book of orderedBooks) {
      const d = book.media && 'duration' in book.media ? book.media.duration : 0
      sum += typeof d === 'number' && Number.isFinite(d) ? d : 0
    }
    return sum
  }, [orderedBooks])

  const totalListenedSeconds = useMemo(() => {
    let sum = 0
    for (const book of orderedBooks) {
      const duration = book.media && 'duration' in book.media ? book.media.duration : 0
      const progress = getMediaItemProgress(user.mediaProgress, book.id)
      if (!progress) continue
      sum += progress.isFinished ? typeof duration === 'number' ? duration : 0 : progress.currentTime || 0
    }
    return sum
  }, [orderedBooks, user.mediaProgress])

  const totalDurationLabel = totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds, t, { showDays: true }) : null
  const totalListenedLabel = totalListenedSeconds > 0 ? formatDuration(totalListenedSeconds, t, { showDays: true }) : null

  const itemCountSupplementLabel = useMemo(() => {
    if (!totalDurationLabel) return null
    if (totalListenedLabel) return ` (${totalListenedLabel} / ${totalDurationLabel} total)`
    return ` (${totalDurationLabel})`
  }, [totalDurationLabel, totalListenedLabel])

  useEffect(() => {
    setItemCount(totalEntities)
    setItemCountSupplement(itemCountSupplementLabel)
    return () => {
      setItemCount(null)
    }
  }, [totalEntities, itemCountSupplementLabel, setItemCount, setItemCountSupplement])

  return {
    orderedBooks,
    setOrderedBooks,
    handleItemRemoved
  }
}
