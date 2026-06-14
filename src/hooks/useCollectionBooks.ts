'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import type { Collection, LibraryItem } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function useCollectionBooks(collection: Collection) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { setItemCount, setItemCountSupplement } = useLibrary()

  const serverBookIds = useMemo(() => (collection.books ?? []).map((b) => b.id).join(','), [collection.books])

  const [orderedBooks, setOrderedBooks] = useState<LibraryItem[]>(() => collection.books ?? [])

  const handleLibraryItemRemovedFromSortableList = useCallback(
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

  const totalEntities = orderedBooks.length

  const totalDurationSeconds = useMemo(() => {
    let sum = 0
    for (const book of orderedBooks) {
      const d = book.media && 'duration' in book.media ? book.media.duration : 0
      sum += typeof d === 'number' && Number.isFinite(d) ? d : 0
    }
    return sum
  }, [orderedBooks])

  const totalDurationLabel = totalDurationSeconds > 0 ? formatDuration(totalDurationSeconds, t, { showDays: true }) : null

  useEffect(() => {
    setItemCount(totalEntities)
    setItemCountSupplement(totalDurationLabel ? ` (${totalDurationLabel})` : null)
    return () => {
      setItemCount(null)
    }
  }, [totalEntities, totalDurationLabel, setItemCount, setItemCountSupplement])

  return {
    orderedBooks,
    setOrderedBooks,
    handleLibraryItemRemovedFromSortableList
  }
}
