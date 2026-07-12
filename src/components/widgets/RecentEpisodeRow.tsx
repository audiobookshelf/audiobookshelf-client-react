'use client'

import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import PreviewCover from '@/components/covers/PreviewCover'
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal'
import ViewEpisodeModal from '@/components/modals/ViewEpisodeModal'
import BonusIndicator from '@/components/widgets/BonusIndicator'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import PodcastEpisodeListenActions from '@/components/widgets/episode/PodcastEpisodeListenActions'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import TrailerIndicator from '@/components/widgets/TrailerIndicator'
import { useBookCoverAspectRatio, useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useEpisodeListenActions } from '@/hooks/usetEpisodeListenActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { sanitizeEpisodeDescriptionHtml } from '@/lib/episode'
import { buildRecentEpisodesQueueFromIndex } from '@/lib/recentEpisodes'
import type { PodcastLibraryItem, RecentPodcastEpisode } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useCallback, useMemo, useState, useTransition } from 'react'

interface RecentEpisodeRowProps {
  episode: RecentPodcastEpisode
  episodeIndex: number
  episodes: RecentPodcastEpisode[]
}

export default function RecentEpisodeRow({ episode, episodeIndex, episodes }: RecentEpisodeRowProps) {
  const t = useTypeSafeTranslations()
  const { setBoundModal } = useLibrary()
  const { user } = useUser()
  const { showToast } = useGlobalToast()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const [, startTransition] = useTransition()
  const [openingItem, setOpeningItem] = useState(false)

  const podcastTitle = episode.podcast.metadata?.title ?? ''
  const isExplicit = !!episode.podcast.metadata?.explicit
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  const coverLibraryItem = useMemo(
    () => ({
      id: episode.libraryItemId,
      libraryId: episode.libraryId,
      updatedAt: episode.updatedAt,
      media: episode.podcast,
      mediaType: 'podcast' as const,
      ino: '',
      path: '',
      relPath: '',
      isFile: false,
      mtimeMs: 0,
      ctimeMs: 0,
      birthtimeMs: 0,
      addedAt: 0,
      isMissing: false,
      isInvalid: false
    }),
    [episode]
  )

  const coverSrc = getLibraryItemCoverSrc(coverLibraryItem, placeholderUrl)
  const descriptionHtml = sanitizeEpisodeDescriptionHtml(episode.subtitle || episode.description || '')

  const publishedDateLabel = episode.publishedAt ? formatDistanceToNow(new Date(episode.publishedAt), { addSuffix: true }) : t('LabelUnknownPublishDate')

  const getQueueItems = useCallback(
    () => buildRecentEpisodesQueueFromIndex(episodes, user.mediaProgress, episodeIndex),
    [episodeIndex, episodes, user.mediaProgress]
  )

  const {
    userIsFinished,
    userProgressPercent,
    episodeIsPlaying,
    isQueued,
    showQueueButton,
    playButtonLabel,
    isProcessingFinished,
    playlistsModalOpen,
    confirmState,
    handlePlay,
    handleQueueToggle,
    handleToggleFinished,
    handleOpenPlaylist,
    closePlaylistsModal,
    closeConfirm
  } = useEpisodeListenActions({
    libraryItemId: episode.libraryItemId,
    episode,
    itemTitle: episode.title,
    getQueueItems
  })

  const clearBoundModal = useCallback(() => setBoundModal(null), [setBoundModal])

  const handleRowClick = useCallback(() => {
    if (openingItem) return

    setOpeningItem(true)
    startTransition(async () => {
      try {
        const fullLibraryItem = await getExpandedLibraryItemAction(episode.libraryItemId)
        setBoundModal(
          <ViewEpisodeModal
            key={`view-episode-modal-${episode.id}`}
            isOpen
            libraryItem={fullLibraryItem as PodcastLibraryItem}
            episode={episode}
            onClose={clearBoundModal}
          />
        )
      } catch (error) {
        console.error('Failed to get library item', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
      } finally {
        setOpeningItem(false)
      }
    })
  }, [clearBoundModal, episode, openingItem, setBoundModal, showToast, t])

  const itemHref = `/library/${episode.libraryId}/item/${episode.libraryItemId}`

  return (
    <>
      <div className="relative flex min-w-0 cursor-pointer py-5" onClick={handleRowClick}>
        <div className="hidden shrink-0 md:block">
          <PreviewCover src={coverSrc} width={96} bookCoverAspectRatio={bookCoverAspectRatio} showResolution={false} />
        </div>

        <div className="w-full min-w-0 grow md:max-w-2xl md:ps-4">
          <div className="mb-2 flex min-w-0 md:hidden">
            <PreviewCover src={coverSrc} width={48} bookCoverAspectRatio={bookCoverAspectRatio} showResolution={false} />
            <div className="min-w-0 flex-1 px-2">
              <div className="flex min-w-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Link href={itemHref} className="text-foreground-muted hover:text-foreground min-w-0 flex-1 text-sm break-words hover:underline">
                  {podcastTitle}
                </Link>
                {isExplicit && <ExplicitIndicator className="shrink-0" />}
              </div>
              <p className="text-foreground-subdued mb-1 text-xs">{publishedDateLabel}</p>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="flex min-w-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Link href={itemHref} className="text-foreground-muted hover:text-foreground min-w-0 text-sm break-words hover:underline">
                {podcastTitle}
              </Link>
              {isExplicit && <ExplicitIndicator className="shrink-0" />}
            </div>
            <p className="text-foreground-subdued mb-1 text-xs">{publishedDateLabel}</p>
          </div>

          {(episode.season || episode.episode) && (
            <div className="text-foreground flex items-center font-semibold">
              <span>#</span>
              {episode.season && <span>{episode.season}x</span>}
              {episode.episode && <span>{episode.episode}</span>}
            </div>
          )}

          <div dir="auto" className="mb-2 flex min-w-0 items-start gap-1">
            <button
              type="button"
              disabled={openingItem}
              className="focus-visible:outline-foreground-muted min-w-0 flex-1 cursor-pointer rounded-sm text-start text-sm font-semibold break-words focus-visible:outline-1 focus-visible:outline-offset-4 md:text-base"
              onClick={(e) => {
                e.stopPropagation()
                handleRowClick()
              }}
            >
              {episode.title}
            </button>
            {episode.episodeType === 'bonus' && <BonusIndicator className="ms-1 shrink-0" />}
            {episode.episodeType === 'trailer' && <TrailerIndicator className="ms-1 shrink-0" />}
          </div>

          {descriptionHtml && (
            <div
              dir="auto"
              className="text-foreground-muted mb-4 line-clamp-4 min-w-0 text-sm break-words [&_*]:break-words"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') {
                  e.stopPropagation()
                }
              }}
            />
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <PodcastEpisodeListenActions
              playButtonLabel={playButtonLabel}
              isPlaying={episodeIsPlaying}
              isFinished={userIsFinished}
              isProcessingFinished={isProcessingFinished}
              showQueueButton={showQueueButton}
              isQueued={isQueued}
              onPlay={handlePlay}
              onQueueToggle={handleQueueToggle}
              onToggleFinished={handleToggleFinished}
              onAddToPlaylist={handleOpenPlaylist}
            />
          </div>
        </div>

        {!userIsFinished && userProgressPercent > 0 && (
          <div className="bg-warning pointer-events-none absolute bottom-0 left-0 h-0.5" style={{ width: `${userProgressPercent * 100}%` }} />
        )}
      </div>

      {playlistsModalOpen && (
        <AddToPlaylistModal
          isOpen={playlistsModalOpen}
          onClose={closePlaylistsModal}
          libraryId={episode.libraryId}
          items={[{ libraryItemId: episode.libraryItemId, episodeId: episode.id }]}
          headerTitle={episode.title}
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
    </>
  )
}

export function RecentEpisodeRowDivider() {
  return <div className="bg-foreground/10 h-px w-full" />
}
