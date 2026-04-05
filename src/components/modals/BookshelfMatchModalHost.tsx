'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import MatchModal from '@/components/modals/MatchModal'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useLayoutEffect, useState, useTransition } from 'react'

interface BookshelfMatchModalHostProps {
  libraryItemId: string
  onClose: () => void
}

export default function BookshelfMatchModalHost({ libraryItemId, onClose }: BookshelfMatchModalHostProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [libraryItem, setLibraryItem] = useState<BookLibraryItem | PodcastLibraryItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // Layout effect: first paint should see isPending true (useEffect would flash empty before libraryItem exists).
  useLayoutEffect(() => {
    let cancelled = false
    startTransition(async () => {
      try {
        const full = await getExpandedLibraryItemAction(libraryItemId)
        if (cancelled) return
        setLibraryItem(full as BookLibraryItem | PodcastLibraryItem)
      } catch (error) {
        console.error('Failed to load library item for match', error)
        if (!cancelled) {
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
          onClose()
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [libraryItemId, startTransition, onClose, showToast, t])

  return <MatchModal isOpen={true} onClose={onClose} libraryItem={libraryItem} loading={isPending} />
}
