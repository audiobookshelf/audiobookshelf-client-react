'use client'

import { updateLibraryItemMediaAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import BookDetailsEdit, { BookDetailsEditRef, BookUpdatePayload } from '@/components/widgets/BookDetailsEdit'
import PodcastDetailsEdit, { PodcastDetailsEditRef, PodcastUpdatePayload } from '@/components/widgets/PodcastDetailsEdit'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

interface LibraryItemEditModalProps {
  isOpen: boolean
  libraryItem: BookLibraryItem | PodcastLibraryItem
  onClose: () => void
  onSaved?: (libraryItem: BookLibraryItem | PodcastLibraryItem) => void
}

/**
 * Modal for editing library item metadata.
 * Renders BookDetailsEdit for books and PodcastDetailsEdit for podcasts.
 * Uses filter data from LibraryContext for autocomplete options.
 */
export default function LibraryItemEditModal({ isOpen, libraryItem, onClose, onSaved }: LibraryItemEditModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { filterData, filterDataLoading } = useLibrary()
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)

  const bookDetailsRef = useRef<BookDetailsEditRef>(null)
  const podcastDetailsRef = useRef<PodcastDetailsEditRef>(null)

  const isPodcast = libraryItem.mediaType === 'podcast'

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasChanges(false)
    }
  }, [isOpen])

  // Convert filter data to MultiSelect item format
  const availableAuthors = (filterData?.authors || []).map((a) => ({ value: a.id, content: a.name }))
  const availableNarrators = (filterData?.narrators || []).map((n) => ({ value: n, content: n }))
  const availableGenres = (filterData?.genres || []).map((g) => ({ value: g, content: g }))
  const availableTags = (filterData?.tags || []).map((tag) => ({ value: tag, content: tag }))
  const availableSeries = (filterData?.series || []).map((s) => ({ value: s.id, content: s.name }))

  const handleChange = (_details: { libraryItemId: string; hasChanges: boolean }) => {
    setHasChanges(_details.hasChanges)
  }

  const handleSubmit = useCallback(
    (details: { updatePayload: BookUpdatePayload | PodcastUpdatePayload; hasChanges: boolean }) => {
      if (!details.hasChanges) {
        onClose()
        return
      }

      startTransition(async () => {
        try {
          const updatedItem = await updateLibraryItemMediaAction(libraryItem.id, {
            metadata: details.updatePayload.metadata,
            tags: details.updatePayload.tags
          })
          showToast(t('ToastItemUpdateSuccess'), { type: 'success' })
          onSaved?.(updatedItem.libraryItem as BookLibraryItem | PodcastLibraryItem)
          onClose()
        } catch (error) {
          console.error('Failed to update library item:', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [libraryItem.id, onClose, onSaved, showToast, t]
  )

  const handleSave = () => {
    if (isPodcast) {
      podcastDetailsRef.current?.submit()
    } else {
      bookDetailsRef.current?.submit()
    }
  }

  const isProcessing = isPending || filterDataLoading

  const outerContentTitle = (
    <div className="absolute top-0 start-0 p-4">
      <h2 className="text-lg text-foreground">{libraryItem.media.metadata.title}</h2>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContentTitle} processing={isProcessing} className="sm:max-w-screen md:max-w-screen">
      <div className="w-full overflow-x-hidden overflow-y-auto rounded-lg max-h-[85vh]">
        {/* Content */}
        <div className="min-h-[400px]">
          {isPodcast ? (
            <PodcastDetailsEdit
              ref={podcastDetailsRef}
              libraryItem={libraryItem as PodcastLibraryItem}
              availableGenres={availableGenres}
              availableTags={availableTags}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          ) : (
            <BookDetailsEdit
              ref={bookDetailsRef}
              libraryItem={libraryItem as BookLibraryItem}
              availableAuthors={availableAuthors}
              availableNarrators={availableNarrators}
              availableGenres={availableGenres}
              availableTags={availableTags}
              availableSeries={availableSeries}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-bg px-4 py-3 border-t border-border flex justify-end gap-3">
          <Btn onClick={onClose} disabled={isPending}>
            {t('ButtonCancel')}
          </Btn>
          <Btn color="bg-success" onClick={handleSave} disabled={!hasChanges} loading={isPending}>
            {t('ButtonSave')}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
