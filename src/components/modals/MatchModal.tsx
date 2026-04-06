'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import Match from '@/components/widgets/Match'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useLayoutEffect, useState, useTransition } from 'react'

export type MatchModalProps = {
  isOpen: boolean
  onClose: () => void
} & ({ libraryItem: BookLibraryItem | PodcastLibraryItem } | { libraryItemId: string })

export default function MatchModal(props: MatchModalProps) {
  const { isOpen, onClose } = props

  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [fetchedItem, setFetchedItem] = useState<BookLibraryItem | PodcastLibraryItem | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchMode = 'libraryItemId' in props
  const libraryItemId = fetchMode ? (props.libraryItemId as string) : undefined

  useLayoutEffect(() => {
    if (!isOpen || !fetchMode) return

    let cancelled = false
    startTransition(async () => {
      try {
        const full = await getExpandedLibraryItemAction(libraryItemId!)
        if (cancelled) return
        setFetchedItem(full as BookLibraryItem | PodcastLibraryItem)
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
  }, [isOpen, onClose, showToast, startTransition, t, fetchMode, libraryItemId])

  if (!isOpen) return null

  const resolvedItem = fetchMode ? fetchedItem : props.libraryItem
  const loading = fetchMode && isPending && !fetchedItem

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex h-[80vh] flex-col overflow-hidden">
        {loading && !resolvedItem ? (
          <div className="relative min-h-0 flex-1">
            <LoadingIndicator label="LabelLoadingLibraryItem" />
          </div>
        ) : resolvedItem ? (
          <Match libraryItem={resolvedItem} />
        ) : null}
      </div>
    </Modal>
  )
}
