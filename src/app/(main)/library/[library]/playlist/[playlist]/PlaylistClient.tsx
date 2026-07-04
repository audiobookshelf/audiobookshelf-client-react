'use client'

import PlaylistEditModal from '@/components/modals/PlaylistEditModal'
import Btn from '@/components/ui/Btn'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { mapMediaCardMoreMenuItemsToDropdownItems } from '@/components/widgets/media-card/MediaCardMoreMenu'
import PlaylistGroupCover from '@/components/widgets/media-card/PlaylistGroupCover'
import { usePlaylistCardActions } from '@/components/widgets/media-card/usePlaylistCardActions'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useMediaContext } from '@/contexts/MediaContext'
import { usePrimaryInputCanHover } from '@/contexts/SortableCompilationContext'
import { useUser } from '@/contexts/UserContext'
import { usePlaylistDisplayMode } from '@/hooks/usePlaylistDisplayMode'
import { usePlaylistItems } from '@/hooks/usePlaylistItems'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { buildPlaylistQueueItems, getPlayablePlaylistItems } from '@/lib/compilationPlayback'
import { getQueueItemPlaybackStartTime } from '@/lib/playerQueue'
import type { Playlist } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PlaylistItems from './PlaylistItems'

interface PlaylistClientProps {
  playlist: Playlist
}

export default function PlaylistClient({ playlist }: PlaylistClientProps) {
  const coverAspectRatio = useBookCoverAspectRatio()
  const { library } = useLibrary()
  const { user, userCanUpdate } = useUser()
  const primaryInputCanHover = usePrimaryInputCanHover()
  const { playItem, isPlaying } = useMediaContext()
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { displayMode, toggleDisplayMode } = usePlaylistDisplayMode(library.mediaType)
  const { orderedItems, setOrderedItems, handleItemRemoved } = usePlaylistItems(playlist)
  const isListMode = displayMode === 'list'
  const alternateViewLabel = isListMode ? t('LabelCollectionBookshelfView') : t('LabelCollectionListView')
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [mobileReorderActive, setMobileReorderActive] = useState(false)

  useEffect(() => {
    if (primaryInputCanHover) setMobileReorderActive(false)
  }, [primaryInputCanHover])

  const handlePlaylistDeleted = useCallback(() => {
    router.push(`/library/${playlist.libraryId}/playlists`)
  }, [playlist.libraryId, router])

  const { processing, confirmState, closeConfirm, handleMoreAction, moreMenuItems } = usePlaylistCardActions({
    playlist,
    onPlaylistDeleted: handlePlaylistDeleted
  })

  const playlistHeaderMoreItems = useMemo(() => mapMediaCardMoreMenuItemsToDropdownItems(moreMenuItems), [moreMenuItems])

  const handlePlaylistHeaderMoreAction = useCallback(
    ({ action }: { action: string }) => {
      if (!action) return
      handleMoreAction(action)
    },
    [handleMoreAction]
  )

  const playableItems = useMemo(() => getPlayablePlaylistItems(orderedItems), [orderedItems])
  const showPlayButton = playableItems.length > 0

  const streaming = useMemo(() => {
    return playableItems.some((item) => isPlaying(item.libraryItemId, item.episodeId ?? null))
  }, [isPlaying, playableItems])

  const handlePlayAll = useCallback(() => {
    const queueItems = buildPlaylistQueueItems(orderedItems, user.mediaProgress)
    if (queueItems.length === 0) return

    // Queue is in playlist order with finished items removed (unless all are finished).
    // Always start at the first unfinished item and resume from saved progress.
    const startItem = queueItems[0]
    const libraryItem = playableItems.find(
      (i) => i.libraryItemId === startItem.libraryItemId && (i.episodeId ?? null) === (startItem.episodeId ?? null)
    )?.libraryItem
    if (!libraryItem) return

    void playItem({
      libraryItem,
      episodeId: startItem.episodeId,
      startTime: getQueueItemPlaybackStartTime(startItem, user.mediaProgress),
      queueItems
    })
  }, [playItem, playableItems, orderedItems, user.mediaProgress])

  const showHeaderActions = userCanUpdate || moreMenuItems.length > 0

  const playlistItems = (
    <PlaylistItems
      playlist={playlist}
      displayMode={displayMode}
      mobileReorderActive={mobileReorderActive}
      orderedItems={orderedItems}
      setOrderedItems={setOrderedItems}
      onItemRemoved={handleItemRemoved}
    />
  )

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:items-start">
        <PlaylistGroupCover items={orderedItems} width={coverWidth * 2} height={coverHeight * 2} />
        <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <h1 className="text-foreground min-w-0 px-2 text-2xl font-bold break-words md:flex-1 md:truncate">{playlist.name}</h1>
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
                      items={playlistHeaderMoreItems}
                      processing={processing}
                      onAction={handlePlaylistHeaderMoreAction}
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
          {playlist.description && <p className="text-foreground-muted px-2">{playlist.description}</p>}
          {isListMode && playlistItems}
        </div>
      </div>

      {!isListMode && playlistItems}

      {userCanUpdate && (
        <PlaylistEditModal isOpen={editModalOpen} playlist={playlist} onClose={() => setEditModalOpen(false)} onSaved={() => router.refresh()} />
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
