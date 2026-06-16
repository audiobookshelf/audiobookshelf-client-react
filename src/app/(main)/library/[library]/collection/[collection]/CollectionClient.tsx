'use client'

import CollectionEditModal from '@/components/modals/CollectionEditModal'
import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import Btn from '@/components/ui/Btn'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { mapMediaCardMoreMenuItemsToDropdownItems } from '@/components/widgets/media-card/MediaCardMoreMenu'
import { useCollectionCardActions } from '@/components/widgets/media-card/useCollectionCardActions'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { usePrimaryInputCanHover } from '@/contexts/SortableCompilationContext'
import { useUser } from '@/contexts/UserContext'
import { useCollectionBooks } from '@/hooks/useCollectionBooks'
import { useCollectionDisplayMode } from '@/hooks/useCollectionDisplayMode'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { buildCollectionQueueItems, getPlayableCollectionBooks, getQueueItemPlaybackStartTime } from '@/lib/compilationPlayback'
import { Collection } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CollectionItems from './CollectionItems'

interface CollectionClientProps {
  collection: Collection
}

export default function CollectionClient({ collection }: CollectionClientProps) {
  const coverAspectRatio = useBookCoverAspectRatio()
  const { user, userCanUpdate, userIsAdminOrUp } = useUser()
  const { playItem, isPlaying } = useMediaContext()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { displayMode, toggleDisplayMode } = useCollectionDisplayMode()
  const { orderedBooks, setOrderedBooks, handleItemRemoved } = useCollectionBooks(collection)
  const isListMode = displayMode === 'list'
  const alternateViewLabel = isListMode ? t('LabelCollectionBookshelfView') : t('LabelCollectionListView')
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  const rssFeed = useMemo(() => collection.rssFeed ?? null, [collection.rssFeed])
  const [rssFeedModalOpen, setRssFeedModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [mobileReorderActive, setMobileReorderActive] = useState(false)

  useEffect(() => {
    if (primaryInputCanHover) setMobileReorderActive(false)
  }, [primaryInputCanHover])

  const handleOpenRssFeedModal = useCallback(() => {
    setRssFeedModalOpen(true)
  }, [])

  const handleCollectionDeleted = useCallback(() => {
    router.push(`/library/${collection.libraryId}/collections`)
  }, [collection.libraryId, router])

  const { processing, confirmState, closeConfirm, handleMoreAction, moreMenuItems } = useCollectionCardActions({
    collection,
    rssFeed,
    onOpenRssFeedModal: handleOpenRssFeedModal,
    onCollectionDeleted: handleCollectionDeleted
  })

  const collectionHeaderMoreItems = useMemo(() => mapMediaCardMoreMenuItemsToDropdownItems(moreMenuItems), [moreMenuItems])

  const handleCollectionHeaderMoreAction = useCallback(
    ({ action }: { action: string }) => {
      if (!action) return
      handleMoreAction(action)
    },
    [handleMoreAction]
  )

  const playableBooks = useMemo(() => getPlayableCollectionBooks(collection.books ?? []), [collection.books])
  const showPlayButton = playableBooks.length > 0

  const streaming = useMemo(() => {
    return playableBooks.some((book) => isPlaying(book.id, null))
  }, [isPlaying, playableBooks])

  const handlePlayAll = useCallback(() => {
    const queueItems = buildCollectionQueueItems(collection.books ?? [], user.mediaProgress)
    if (queueItems.length === 0) return

    // Queue is in collection order with finished items removed (unless all are finished).
    // Always start at the first unfinished item and resume from saved progress.
    const startItem = queueItems[0]
    const libraryItem = playableBooks.find((book) => book.id === startItem.libraryItemId)
    if (!libraryItem) return

    void playItem({
      libraryItem,
      startTime: getQueueItemPlaybackStartTime(startItem, user.mediaProgress),
      queueItems
    })
  }, [playItem, playableBooks, collection.books, user.mediaProgress])

  const showHeaderActions = userCanUpdate || moreMenuItems.length > 0

  const collectionItems = (
    <CollectionItems
      collection={collection}
      displayMode={displayMode}
      mobileReorderActive={mobileReorderActive}
      orderedBooks={orderedBooks}
      setOrderedBooks={setOrderedBooks}
      onItemRemoved={handleItemRemoved}
    />
  )

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:items-start">
        <CollectionGroupCover books={collection.books ?? []} width={coverWidth * 2} height={coverHeight} />
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <h1 className="text-foreground min-w-0 px-2 text-2xl font-bold break-words md:flex-1 md:truncate">{collection.name}</h1>
            <div className="flex shrink-0 flex-wrap items-center gap-1 px-2 md:px-0">
              {showPlayButton && (
                <Btn color="bg-success" size="small" className="mr-1 h-9" disabled={streaming} onClick={handlePlayAll}>
                  {!streaming && <span className="material-symbols fill -ml-2 pr-1 text-2xl text-white">play_arrow</span>}
                  {streaming ? t('ButtonPlaying') : t('ButtonPlayAll')}
                </Btn>
              )}
              <Tooltip text={alternateViewLabel} position="top">
                <span className="inline-flex">
                  <IconBtn ariaLabel={alternateViewLabel} onClick={toggleDisplayMode} outlined className="mx-0.5" size="small">
                    {isListMode ? 'view_module' : 'view_list'}
                  </IconBtn>
                </span>
              </Tooltip>
              {showHeaderActions && (
                <>
                  {userCanUpdate && (
                    <Tooltip text={t('LabelEdit')} position="top">
                      <span className="inline-flex">
                        <IconBtn ariaLabel={t('LabelEdit')} onClick={() => setEditModalOpen(true)} outlined className="mx-0.5" size="small">
                          edit
                        </IconBtn>
                      </span>
                    </Tooltip>
                  )}
                  {userCanUpdate && !primaryInputCanHover && (
                    <Tooltip text={mobileReorderActive ? t('LabelCollectionDoneReordering') : t('LabelCollectionReorderBooks')} position="top">
                      <span className="inline-flex">
                        <IconBtn
                          ariaLabel={mobileReorderActive ? t('LabelCollectionDoneReordering') : t('LabelCollectionReorderBooks')}
                          aria-pressed={mobileReorderActive}
                          onClick={() => setMobileReorderActive((v) => !v)}
                          outlined
                          className="mx-0.5"
                          size="small"
                        >
                          {mobileReorderActive ? 'check' : 'reorder'}
                        </IconBtn>
                      </span>
                    </Tooltip>
                  )}
                  {moreMenuItems.length > 0 && (
                    <ContextMenuDropdown
                      items={collectionHeaderMoreItems}
                      processing={processing}
                      onAction={handleCollectionHeaderMoreAction}
                      size="small"
                      menuAlign="right"
                      autoWidth
                      usePortal
                      className="mx-0.5"
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {collection.description && <p className="text-foreground-muted px-2">{collection.description}</p>}
          {isListMode && collectionItems}
        </div>
      </div>

      {!isListMode && collectionItems}

      {userCanUpdate && (
        <CollectionEditModal isOpen={editModalOpen} collection={collection} onClose={() => setEditModalOpen(false)} onSaved={() => router.refresh()} />
      )}

      {userIsAdminOrUp && (
        <RssFeedOpenCloseModal
          isOpen={rssFeedModalOpen}
          onClose={() => setRssFeedModalOpen(false)}
          entity={{
            id: collection.id,
            name: collection.name,
            type: 'collection',
            feed: rssFeed
          }}
          onFeedChange={() => router.refresh()}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message={confirmState.message}
          checkboxLabel={confirmState.checkboxLabel}
          yesButtonText={confirmState.yesButtonText}
          yesButtonClassName={confirmState.yesButtonClassName}
          onClose={closeConfirm}
          onConfirm={(value) => {
            confirmState.onConfirm(value)
          }}
        />
      )}
    </div>
  )
}
