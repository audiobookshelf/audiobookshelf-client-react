'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { PlayerQueueItem, useMediaContext } from '@/contexts/MediaContext'
import { MediaItemShare, RssFeed } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BookLibraryItem, BookMetadata, MediaProgress, PodcastLibraryItem, User } from '@/types/api'
import { useCallback, useMemo, useTransition } from 'react'

interface ItemActionButtonsProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  user: User
  mediaProgress: MediaProgress | null
  rssFeed?: RssFeed | null
  mediaItemShare?: MediaItemShare | null
  onToggleFinished?: (isFinished: boolean) => void
  onContextMenuAction?: (action: string) => void
  onMatchClick?: () => void
  onQuickMatchClick?: () => void
}

/**
 * Action buttons row for library item page.
 *
 * Features:
 * - Play button (books with tracks, podcasts with episodes)
 * - Read button (books with ebook)
 * - Queue toggle (books only, when streaming)
 * - Mark finished toggle (books only)
 * - Find episodes button (podcasts, admin only)
 * - Context menu dropdown (Collections, Playlists, Bookmarks, RSS, Download, Share, Delete)
 */
export default function ItemActionButtons({
  libraryItem,
  user,
  mediaProgress,
  rssFeed,
  mediaItemShare,
  onToggleFinished,
  onContextMenuAction,
  onMatchClick,
  onQuickMatchClick
}: ItemActionButtonsProps) {
  const t = useTypeSafeTranslations()
  const { playItem, isStreaming, getIsMediaQueued, addItemToQueue, removeItemFromQueue, streamLibraryItem } = useMediaContext()
  const [isProcessing, startTransition] = useTransition()

  const isBook = libraryItem.mediaType === 'book'
  const isPodcast = libraryItem.mediaType === 'podcast'
  const isMissing = libraryItem.isMissing
  const isInvalid = libraryItem.isInvalid

  const media = libraryItem.media
  const metadata = media.metadata as BookMetadata

  // Memoize derived data to prevent dependency issues
  const tracks = useMemo(() => (isBook ? (libraryItem as BookLibraryItem).media.tracks || [] : []), [isBook, libraryItem])
  const ebookFile = useMemo(() => (isBook ? (libraryItem as BookLibraryItem).media.ebookFile : null), [isBook, libraryItem])
  const chapters = useMemo(() => (isBook ? (libraryItem as BookLibraryItem).media.chapters || [] : []), [isBook, libraryItem])
  const duration = useMemo(() => (isBook ? (libraryItem as BookLibraryItem).media.duration || 0 : 0), [isBook, libraryItem])
  const episodes = useMemo(() => (isPodcast ? (libraryItem as PodcastLibraryItem).media.episodes || [] : []), [isPodcast, libraryItem])

  // User state
  const userIsFinished = mediaProgress?.isFinished || false
  const userCanUpdate = user.permissions?.update || false
  const userCanDelete = user.permissions?.delete || false
  const userCanDownload = user.permissions?.download || false
  const userIsAdmin = user.type === 'admin' || user.type === 'root'

  // Streaming state
  const isCurrentlyStreaming = isStreaming(libraryItem.id)
  const isQueued = getIsMediaQueued(libraryItem.id)

  // Show conditions
  const showPlayButton = !isMissing && !isInvalid && (isPodcast ? episodes.length > 0 : tracks.length > 0)
  const showReadButton = isBook && !!ebookFile
  const showQueueBtn = isBook && !!streamLibraryItem && !isCurrentlyStreaming

  const handlePlayClick = useCallback(() => {
    if (isPodcast) {
      const firstEpisode = episodes[0]
      if (firstEpisode) {
        const queueItems: PlayerQueueItem[] = episodes.map((ep) => ({
          libraryItemId: libraryItem.id,
          libraryId: libraryItem.libraryId,
          episodeId: ep.id,
          title: ep.title,
          subtitle: metadata.title || '',
          caption: '',
          duration: ep.audioTrack?.duration || null,
          coverPath: media.coverPath || null
        }))
        playItem({ libraryItem, episodeId: firstEpisode.id, queueItems })
      }
    } else {
      const queueItem: PlayerQueueItem = {
        libraryItemId: libraryItem.id,
        libraryId: libraryItem.libraryId,
        episodeId: null,
        title: metadata.title || '',
        subtitle: (metadata as BookMetadata).authors?.map((a) => a.name).join(', ') || '',
        caption: '',
        duration: duration || null,
        coverPath: media.coverPath || null
      }
      playItem({ libraryItem, queueItems: [queueItem] })
    }
  }, [libraryItem, episodes, metadata, media, duration, isPodcast, playItem])

  const handleReadClick = useCallback(() => {
    // Open ebook reader - would typically open a modal or navigate
    console.log('Open ebook reader')
  }, [])

  const handleQueueClick = useCallback(() => {
    if (isQueued) {
      removeItemFromQueue({ libraryItemId: libraryItem.id })
    } else {
      const queueItem: PlayerQueueItem = {
        libraryItemId: libraryItem.id,
        libraryId: libraryItem.libraryId,
        episodeId: null,
        title: metadata.title || '',
        subtitle: (metadata as BookMetadata).authors?.map((a) => a.name).join(', ') || '',
        caption: '',
        duration: duration || null,
        coverPath: media.coverPath || null
      }
      addItemToQueue(queueItem)
    }
  }, [isQueued, libraryItem, metadata, media, duration, addItemToQueue, removeItemFromQueue])

  const handleToggleFinishedClick = useCallback(() => {
    startTransition(() => {
      onToggleFinished?.(!userIsFinished)
    })
  }, [userIsFinished, onToggleFinished])

  // Build context menu items - using ContextMenuDropdown's expected format
  const contextMenuItems = useMemo(() => {
    const items: { text: string; action: string }[] = []

    // Match (users with update permission)
    if (userCanUpdate) {
      items.push({ text: t('HeaderMatch') + '...', action: 'match' })
    }

    // Collections (books only, users with update permission)
    if (isBook && userCanUpdate) {
      items.push({ text: t('LabelCollections'), action: 'collections' })
    }

    // Playlists (books with tracks)
    if (!isPodcast && tracks.length > 0) {
      items.push({ text: t('LabelPlaylists'), action: 'playlists' })
    }

    // Bookmarks (books with chapters)
    if (!isPodcast && chapters.length > 0) {
      items.push({ text: t('LabelYourBookmarks'), action: 'bookmarks' })
    }

    // RSS Feed (admin or if feed is open)
    if (userIsAdmin && (tracks.length > 0 || episodes.length > 0)) {
      if (rssFeed) {
        items.push({ text: t('LabelCloseRSSFeed'), action: 'close-rss-feed' })
      } else {
        items.push({ text: t('LabelOpenRSSFeed'), action: 'open-rss-feed' })
      }
    }

    // Download
    if (userCanDownload) {
      items.push({ text: t('LabelDownload'), action: 'download' })
    }

    // Share (admin, books with tracks)
    if (userIsAdmin && !isPodcast && tracks.length > 0) {
      if (mediaItemShare) {
        items.push({ text: t('LabelCloseShare'), action: 'close-share' })
      } else {
        items.push({ text: t('LabelShare'), action: 'open-share' })
      }
    }

    // Embed (books only, users with update permission)
    if (isBook && userCanUpdate) {
      items.push({ text: 'Embed...', action: 'embed' })
    }

    // Convert to M4B (books only, users with update permission)
    if (isBook && userCanUpdate) {
      items.push({ text: 'Convert to M4B...', action: 'convert-m4b' })
    }

    // Delete
    if (userCanDelete) {
      items.push({ text: t('ButtonDelete'), action: 'delete' })
    }

    return items
  }, [isBook, isPodcast, userCanUpdate, userCanDownload, userCanDelete, userIsAdmin, tracks, chapters, episodes, t, rssFeed, mediaItemShare])

  const handleContextMenuAction = useCallback(
    ({ action }: { action: string }) => {
      if (action === 'match') {
        onMatchClick?.()
        return
      }
      onContextMenuAction?.(action)
    },
    [onContextMenuAction, onMatchClick]
  )

  return (
    <div className="flex items-center justify-start gap-1 flex-wrap pt-6">
      {/* Play button */}
      {showPlayButton && (
        <Btn
          color={isCurrentlyStreaming ? 'bg-primary' : 'bg-success'}
          size="small"
          disabled={isCurrentlyStreaming}
          onClick={handlePlayClick}
          className="flex items-center gap-1"
        >
          {!isCurrentlyStreaming && <span className="material-symbols fill text-xl">play_arrow</span>}
          {isCurrentlyStreaming ? t('ButtonPlaying') : t('ButtonPlay')}
        </Btn>
      )}

      {/* Missing/Invalid indicator */}
      {(isMissing || isInvalid) && (
        <Btn color="bg-error" size="small" className="flex items-center gap-1">
          <span className="material-symbols text-xl">error</span>
          {isMissing ? t('LabelMissing') : t('LabelIncomplete')}
        </Btn>
      )}

      {/* Read button */}
      {showReadButton && (
        <Btn color="bg-info" size="small" onClick={handleReadClick} className="flex items-center gap-1">
          <span className="material-symbols text-xl">auto_stories</span>
          {t('ButtonRead')}
        </Btn>
      )}

      {/* Queue button */}
      {showQueueBtn && (
        <Tooltip text={isQueued ? t('ButtonQueueRemoveItem') : t('ButtonQueueAddItem')} position="top">
          <IconBtn className={isQueued ? 'text-success' : ''} onClick={handleQueueClick}>
            {isQueued ? 'playlist_add_check' : 'playlist_play'}
          </IconBtn>
        </Tooltip>
      )}

      {/* Add Field Dropdown - REMOVED, moved to details section */}
      {/* isPageEditMode && availableAddFields && ... */}

      {/* Mark finished toggle (books only) */}
      {!isPodcast && (
        <Tooltip text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')} position="top">
          <ReadIconBtn isRead={userIsFinished} disabled={isProcessing} onClick={handleToggleFinishedClick} />
        </Tooltip>
      )}

      {/* Quick Match button */}
      {userCanUpdate && onQuickMatchClick && (
        <Tooltip text={t('ButtonQuickMatch')} position="top">
          <IconBtn outlined onClick={onQuickMatchClick} ariaLabel={t('ButtonQuickMatch')}>
            edit_square
          </IconBtn>
        </Tooltip>
      )}

      {/* Context menu - uses built-in button from ContextMenuDropdown */}
      {contextMenuItems.length > 0 && <ContextMenuDropdown items={contextMenuItems} onAction={handleContextMenuAction} autoWidth />}
    </div>
  )
}
