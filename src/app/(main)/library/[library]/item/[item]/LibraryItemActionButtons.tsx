'use client'

import MatchModal from '@/components/modals/MatchModal'
import RssFeedOpenCloseModal from '@/components/modals/RssFeedOpenCloseModal'
import ShareModal from '@/components/modals/ShareModal'
import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { type ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useMediaCardActions } from '@/components/widgets/media-card/useMediaCardActions'
import { useMediaContext } from '@/contexts/MediaContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { PlayerState, type BookLibraryItem, type PodcastLibraryItem, type RssFeed } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface LibraryItemActionButtonsProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  onEdit: () => void
  /** Current RSS feed state (from useItemPageSocket + initial server data). */
  rssFeed?: RssFeed | null
}

export default function LibraryItemActionButtons({ libraryItem, onEdit, rssFeed = null }: LibraryItemActionButtonsProps) {
  const { userCanUpdate, getLibraryItemProgress, ereaderDevices } = useUser()
  const {
    playItem,
    libraryItemIdStreaming,
    streamLibraryItem,
    isStreaming: isStreamingFn,
    isPlaying: isPlayingFn,
    isStreamingFromDifferentLibrary,
    getIsMediaQueued,
    addItemToQueue,
    removeItemFromQueue,
    playerHandler
  } = useMediaContext()
  const t = useTypeSafeTranslations()
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const handleOpenMatch = useCallback(() => {
    setMatchModalOpen(true)
  }, [])

  const mediaProgress = getLibraryItemProgress(libraryItem.id)
  const isRead = mediaProgress?.isFinished ?? false

  const isPodcast = libraryItem.mediaType === 'podcast'
  const isBook = libraryItem.mediaType === 'book'
  const bookMedia = !isPodcast ? libraryItem.media : null
  const podcastMedia = isPodcast ? libraryItem.media : null
  const tracks = isBook ? (bookMedia?.tracks ?? []) : []
  const podcastEpisodes = isPodcast ? (podcastMedia?.episodes ?? []) : []
  const ebookFile = isBook ? bookMedia?.ebookFile : undefined

  const showPlayButton = !libraryItem.isMissing && !libraryItem.isInvalid && (isPodcast ? podcastEpisodes.length > 0 : tracks.length > 0)
  const isStreaming = isStreamingFn(libraryItem.id, null)
  const isItemPlaying = isPlayingFn(libraryItem.id, null)
  const showQueueBtn = isBook && !!streamLibraryItem && !isStreamingFromDifferentLibrary(libraryItem.libraryId)
  const isQueued = getIsMediaQueued(libraryItem.id, null)
  const showReadButton = isBook && !!ebookFile
  const isStreamingFromDifferentLib = isStreamingFromDifferentLibrary(libraryItem.libraryId)

  const {
    processing,
    confirmState,
    rssFeedModalOpen,
    shareModalOpen,
    mediaItemShare,
    closeConfirm,
    closeRssFeedModal,
    closeShareModal,
    handleShareChange,
    handleReadEBook,
    handleMoreAction,
    moreMenuItems
  } = useMediaCardActions({
    libraryItem,
    media: libraryItem.media,
    title: libraryItem.media.metadata.title ?? '',
    author: 'authors' in libraryItem.media.metadata ? (libraryItem.media.metadata.authors ?? []).map((a) => a.name).join(', ') : null,
    episodeForQueue: null,
    mediaProgress,
    itemIsFinished: isRead,
    userProgressPercent: mediaProgress?.progress ?? 0,
    isPodcast,
    ereaderDevices,
    continueListeningShelf: false,
    libraryItemIdStreaming,
    isStreaming: isStreamingFn,
    isStreamingFromDifferentLib,
    isQueued,
    initialShare: libraryItem.mediaItemShare ?? null,
    onDeleteSuccess: () => {
      window.location.href = `/library/${libraryItem.libraryId}`
    },
    onOpenMatch: handleOpenMatch,
    playerControls: playerHandler.controls
  })

  const handlePlay = useCallback(() => {
    if (isStreaming) {
      playerHandler.controls.playPause()
      return
    }
    void playItem({
      libraryItem,
      episodeId: null,
      queueItems: []
    })
  }, [isStreaming, libraryItem, playItem, playerHandler.controls])

  const handleQueueClick = useCallback(() => {
    if (isQueued) {
      removeItemFromQueue({ libraryItemId: libraryItem.id, episodeId: null })
      return
    }

    const title = libraryItem.media.metadata.title ?? ''
    const subtitle = 'authors' in libraryItem.media.metadata ? (libraryItem.media.metadata.authors ?? []).map((a) => a.name).join(', ') : ''
    addItemToQueue({
      libraryItemId: libraryItem.id,
      libraryId: libraryItem.libraryId,
      episodeId: null,
      title,
      subtitle,
      caption: '',
      duration: isBook ? (libraryItem.media.duration ?? null) : null,
      coverPath: libraryItem.media.coverPath ?? null
    })
  }, [addItemToQueue, isBook, isQueued, libraryItem, removeItemFromQueue])

  const handleToggleFinished = useCallback(() => {
    handleMoreAction('toggleFinished')
  }, [handleMoreAction])

  const contextMenuItems = useMemo<ContextMenuDropdownItem<string>[]>(() => {
    return moreMenuItems
      .filter((item) => item.func !== 'toggleFinished')
      .map((item) => ({
        text: item.text,
        action: item.func ?? '',
        subitems: item.subitems?.map((subitem) => ({
          text: subitem.text,
          action: subitem.func,
          data: subitem.data
        }))
      }))
  }, [moreMenuItems])

  const handleContextMenuAction = useCallback(
    ({ action, data }: { action: string; data?: Record<string, string> }) => {
      handleMoreAction(action, data)
    },
    [handleMoreAction]
  )

  const hasContextMenu = contextMenuItems.length > 0

  return (
    <>
      <div className="flex flex-wrap items-center justify-start gap-1 pt-4">
        {showPlayButton && (
          <Btn
            onClick={handlePlay}
            loading={playerHandler.state.playerState === PlayerState.LOADING}
            color="bg-success"
            size="small"
            className="mr-2 flex h-9 items-center px-4"
          >
            <span className="material-symbols fill -ml-2 pr-1 text-2xl text-white">{isItemPlaying ? 'pause' : 'play_arrow'}</span>
            {isItemPlaying ? t('ButtonPause') : t('ButtonPlay')}
          </Btn>
        )}

        {!showPlayButton && (libraryItem.isMissing || libraryItem.isInvalid) && (
          <Btn color="bg-error" size="small" className="mr-2 flex h-9 items-center px-4" disabled>
            <span className="material-symbols -ml-2 pr-1 text-2xl text-white">error</span>
            {libraryItem.isMissing ? t('LabelMissing') : t('LabelIncomplete')}
          </Btn>
        )}

        {showReadButton && (
          <Btn onClick={handleReadEBook} color="bg-info" size="small" className="mr-2 flex h-9 items-center px-4">
            <span className="material-symbols -ml-2 pr-2 text-2xl text-white" aria-hidden>
              auto_stories
            </span>
            {t('ButtonRead')}
          </Btn>
        )}

        {showQueueBtn && (
          <Tooltip text={isQueued ? t('ButtonQueueRemoveItem') : t('ButtonQueueAddItem')} position="top">
            <span className="inline-flex">
              <IconBtn
                ariaLabel={isQueued ? t('ButtonQueueRemoveItem') : t('ButtonQueueAddItem')}
                onClick={handleQueueClick}
                outlined={!isQueued}
                className={isQueued ? 'bg-primary text-success mx-0.5' : 'bg-success/60 mx-0.5'}
                size="small"
              >
                {isQueued ? 'playlist_add_check' : 'playlist_play'}
              </IconBtn>
            </span>
          </Tooltip>
        )}

        {userCanUpdate && (
          <Tooltip text={t('LabelEdit')} position="top">
            <span className="inline-flex">
              <IconBtn ariaLabel={t('LabelEdit')} onClick={onEdit} outlined className="mx-0.5" size="small">
                edit
              </IconBtn>
            </span>
          </Tooltip>
        )}

        {!isPodcast && (
          <Tooltip text={isRead ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="top">
            <span className="inline-flex">
              <ReadIconBtn isRead={isRead} disabled={processing} onClick={handleToggleFinished} className="mx-0.5" size="small" />
            </span>
          </Tooltip>
        )}

        {hasContextMenu && (
          <ContextMenuDropdown
            items={contextMenuItems}
            menuWidth={148}
            onAction={handleContextMenuAction}
            size="small"
            className="bg-primary mx-0.5 h-9 w-9 border border-gray-600"
          />
        )}
      </div>

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
      <RssFeedOpenCloseModal
        isOpen={rssFeedModalOpen}
        onClose={closeRssFeedModal}
        entity={{
          id: libraryItem.id,
          name: libraryItem.media.metadata.title ?? '',
          type: 'item',
          feed: rssFeed ?? null,
          hasEpisodesWithoutPubDate: isPodcast && podcastEpisodes.some((ep) => !ep.pubDate)
        }}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={closeShareModal}
        mediaItemId={libraryItem.media.id ?? ''}
        mediaItemShare={mediaItemShare}
        onShareChange={handleShareChange}
      />
      <MatchModal isOpen={matchModalOpen} onClose={() => setMatchModalOpen(false)} libraryItem={libraryItem} />
    </>
  )
}
