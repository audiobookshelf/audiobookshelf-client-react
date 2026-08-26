'use client'

import { clearPodcastDownloadQueueAction } from '@/app/actions/mediaActions'
import LibraryItemMetadataEditModal, { type MetadataEditSection } from '@/components/modals/LibraryItemMetadataEditModal'
import AudioTracksTable from '@/components/widgets/AudioTracksTable'
import ChaptersTable from '@/components/widgets/ChaptersTable'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import EbookFilesTable from '@/components/widgets/EbookFilesTable'
import EpisodeTable from '@/components/widgets/EpisodeTable'
import ExpandableHtml from '@/components/widgets/ExpandableHtml'
import LibraryFilesTable from '@/components/widgets/LibraryFilesTable'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { mergeLibraryItemUpdate } from '@/lib/libraryItemUpdatedUtils'
import { computeProgress } from '@/lib/mediaProgress'
import { BookLibraryItem, BookMetadata, PodcastEpisode, PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import Link from 'next/link'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import LibraryItemActionButtons from './LibraryItemActionButtons'
import LibraryItemCover from './LibraryItemCover'
import LibraryItemDetails from './LibraryItemDetails'
import LibraryItemProgressPanel from './LibraryItemProgressPanel'
import { useLibraryItemPagePlay } from './useLibraryItemPagePlay'

interface LibraryItemClientProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
}

export default function LibraryItemClient({ libraryItem: initialLibraryItem }: LibraryItemClientProps) {
  const { library } = useLibrary()
  const { serverSettings, getMediaItemProgress, userCanUpdate, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  const [libraryItem, setLibraryItem] = useState(initialLibraryItem)
  const [metadataEditSection, setMetadataEditSection] = useState<MetadataEditSection | null>(null)
  const [isClearQueueDialogOpen, setIsClearQueueDialogOpen] = useState(false)
  const [podcastEpisodesInOrder, setPodcastEpisodesInOrder] = useState<PodcastEpisode[]>([])
  const handlePodcastEpisodesInOrderChange = useCallback((episodes: PodcastEpisode[]) => {
    setPodcastEpisodesInOrder(episodes)
  }, [])

  const { handlePlay, showPlayButton, isItemPlaying } = useLibraryItemPagePlay({ libraryItem, podcastEpisodesInOrder })

  useEffect(() => {
    setLibraryItem(initialLibraryItem)
  }, [initialLibraryItem])

  const isPodcast = libraryItem.mediaType === 'podcast'
  const isBookWithAudio = libraryItem.mediaType === 'book' && ((libraryItem as BookLibraryItem).media.tracks?.length ?? 0) > 0
  const metadata = libraryItem.media.metadata as BookMetadata | PodcastMetadata
  const podcastAuthor = 'author' in metadata ? metadata.author : undefined
  const subtitle = 'subtitle' in metadata ? metadata.subtitle : undefined
  const bookAuthors = 'authors' in metadata ? metadata.authors || [] : []
  const bookSeries = 'series' in metadata && Array.isArray(metadata.series) ? metadata.series : []
  const description = 'description' in metadata ? metadata.description : undefined

  const userProgress = libraryItem.media?.id ? getMediaItemProgress(libraryItem.media.id) : undefined
  const showProgressPanel = useMemo(() => {
    if (isPodcast || !userProgress) return false
    return computeProgress({ progress: userProgress, useSeriesProgress: false }).percent > 0
  }, [isPodcast, userProgress])

  const handleOpenMetadataEdit = (section: MetadataEditSection) => {
    setMetadataEditSection(section)
  }

  const handleCloseMetadataEdit = () => {
    setMetadataEditSection(null)
  }

  const handleItemUpdated = (updatedItem: BookLibraryItem | PodcastLibraryItem) => {
    setLibraryItem((prev) => mergeLibraryItemUpdate(prev, updatedItem) as BookLibraryItem | PodcastLibraryItem)
  }

  const { rssFeed, episodesDownloading, episodeDownloadsQueued } = useItemPageSocket({
    libraryItemId: libraryItem.id,
    mediaId: libraryItem.media?.id,
    isPodcast,
    onItemUpdated: handleItemUpdated,
    initialRssFeed: initialLibraryItem.rssFeed ?? null,
    initialEpisodeDownloadsQueued: initialLibraryItem.episodeDownloadsQueued ?? [],
    initialEpisodesDownloading: initialLibraryItem.episodesDownloading ?? []
  })

  const handleClearDownloadQueue = useCallback(async () => {
    try {
      await clearPodcastDownloadQueueAction(libraryItem.id)
      showToast(t('ToastEpisodeDownloadQueueClearSuccess'), { type: 'success' })
      setIsClearQueueDialogOpen(false)
    } catch (error) {
      console.error('Failed to clear queue', error)
      showToast(t('ToastEpisodeDownloadQueueClearFailed'), { type: 'error' })
    }
  }, [libraryItem.id, showToast, t])

  const coverPath = libraryItem.media?.coverPath
  const accentSourceUrl = useMemo(
    () => (coverPath ? getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true) : null),
    [coverPath, libraryItem.id, libraryItem.updatedAt]
  )
  const accentRgb = useCoverAccentColor(accentSourceUrl)

  useEffect(() => {
    const root = document.documentElement
    if (accentRgb === null) {
      root.style.removeProperty('--tc-library-item-accent-rgb')
      return
    }
    root.style.setProperty('--tc-library-item-accent-rgb', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`)
    return () => {
      root.style.removeProperty('--tc-library-item-accent-rgb')
    }
  }, [accentRgb])

  return (
    <div className="relative isolate h-full min-h-[calc(100vh-var(--header-height))]">
      {accentRgb !== null ? (
        <div aria-hidden className="library-item-cover-accent-backdrop pointer-events-none absolute inset-0 z-0 h-[calc(100vh-var(--header-height))]" />
      ) : null}
      <div className="relative z-[1] p-6 sm:p-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <div className="mx-auto flex w-full max-w-72 flex-shrink-0 items-start justify-center md:w-52 md:max-w-52 md:justify-start">
              <LibraryItemCover
                libraryItem={libraryItem}
                canUpdate={userCanUpdate}
                mediaProgress={userProgress}
                onEdit={() => handleOpenMetadataEdit('cover')}
                showPlayButton={showPlayButton}
                isItemPlaying={isItemPlaying}
                onPlay={handlePlay}
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold md:text-3xl">{libraryItem.media.metadata.title}</h1>
                {subtitle && <h2 className="text-foreground-muted text-xl font-medium md:text-2xl">{subtitle}</h2>}
                {podcastAuthor && <h2 className="text-foreground text-lg font-medium md:text-xl">{t('LabelByAuthor', { 0: podcastAuthor })}</h2>}
                {bookSeries.length > 0 && (
                  <div>
                    {bookSeries.map((series, index) => {
                      return (
                        <Fragment key={series.id}>
                          <Link href={`/library/${library.id}/series/${series.id}`} className="text-foreground-muted text-lg hover:underline">
                            {series.name}
                            {series.sequence && <span className="text-foreground-muted text-lg"> #{series.sequence}</span>}
                          </Link>
                          {index < bookSeries.length - 1 && <span className="text-foreground-muted text-lg">, </span>}
                        </Fragment>
                      )
                    })}
                  </div>
                )}

                {bookAuthors.length > 0 && (
                  <div>
                    <span className="text-foreground text-lg">{t('LabelByAuthor', { 0: '' })}</span>
                    {bookAuthors.map((author, index) => {
                      return (
                        <Fragment key={author.id}>
                          <Link href={`/library/${library.id}/authors/${author.id}`} className="text-foreground text-lg hover:underline md:text-xl">
                            {author.name}
                          </Link>
                          {index < bookAuthors.length - 1 && <span className="text-foreground text-lg md:text-xl">, </span>}
                        </Fragment>
                      )
                    })}
                  </div>
                )}
              </div>

              <LibraryItemDetails libraryItem={libraryItem} />

              {/* Podcast episode downloads queue */}
              {episodeDownloadsQueued.length > 0 && (
                <div className="bg-info/40 relative mx-auto mt-4 max-w-max rounded-md px-4 py-2 text-sm font-semibold text-gray-100 md:mx-0">
                  <div className="flex items-center">
                    <p className="py-1 text-sm">{t('MessageEpisodesQueuedForDownload', { count: episodeDownloadsQueued.length })}</p>
                    {userIsAdminOrUp && (
                      <button
                        type="button"
                        aria-label={t('ButtonClear')}
                        className="material-symbols hover:text-error ml-3 cursor-pointer text-xl"
                        onClick={() => setIsClearQueueDialogOpen(true)}
                      >
                        close
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Podcast episodes currently downloading */}
              {episodesDownloading.length > 0 && (
                <div className="bg-success/20 relative mx-auto mt-4 max-w-max rounded-md px-4 py-2 text-sm font-semibold text-gray-100 md:mx-0">
                  {episodesDownloading.map((episode) => (
                    <div key={episode.id} className="flex items-center">
                      <LoadingSpinner />
                      <p className="py-1 pl-4 text-sm">{t('MessageTaskDownloadingEpisodeDescription', { 0: episode.episodeDisplayTitle ?? '' })}</p>
                    </div>
                  ))}
                </div>
              )}

              {showProgressPanel && userProgress && (
                <LibraryItemProgressPanel
                  libraryItem={libraryItem as BookLibraryItem}
                  mediaProgress={userProgress}
                  dateFormat={serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                />
              )}

              <LibraryItemActionButtons
                libraryItem={libraryItem}
                onEdit={() => handleOpenMetadataEdit('details')}
                onOpenMatch={() => handleOpenMetadataEdit('match')}
                rssFeed={rssFeed ?? null}
                showPlayButton={showPlayButton}
                isItemPlaying={isItemPlaying}
                onPlay={handlePlay}
              />

              {description && <ExpandableHtml html={description} lineClamp={4} className="mt-6" />}

              <div className="mt-6 flex flex-col gap-4">
                {isBookWithAudio && <ChaptersTable libraryItem={libraryItem as BookLibraryItem} onEditChapters={() => handleOpenMetadataEdit('chapters')} />}

                {/* audio tracks table */}
                {libraryItem.mediaType === 'book' && (libraryItem.media.tracks?.length ?? 0) > 0 && (
                  <AudioTracksTable libraryItem={libraryItem as BookLibraryItem} />
                )}

                {/* podcast episodes table */}
                {isPodcast && (
                  <EpisodeTable
                    libraryItem={libraryItem as PodcastLibraryItem}
                    dateFormat={serverSettings?.dateFormat}
                    episodesDownloading={episodesDownloading}
                    episodeDownloadsQueued={episodeDownloadsQueued}
                    onEpisodesInOrderChange={handlePodcastEpisodesInOrderChange}
                  />
                )}

                {/* ebook files table */}
                {libraryItem.mediaType === 'book' && <EbookFilesTable libraryItem={libraryItem as BookLibraryItem} />}

                {/* library files table */}
                {!isPodcast && (libraryItem.libraryFiles?.length ?? 0) > 0 && <LibraryFilesTable libraryItem={libraryItem} />}
              </div>
            </div>
          </div>
        </div>

        <LibraryItemMetadataEditModal
          isOpen={metadataEditSection !== null}
          initialSection={metadataEditSection ?? 'details'}
          libraryItem={libraryItem}
          onClose={handleCloseMetadataEdit}
        />
        <ConfirmDialog
          isOpen={isClearQueueDialogOpen}
          message={t('MessageConfirmClearEpisodeFetchQueue')}
          onClose={() => setIsClearQueueDialogOpen(false)}
          onConfirm={handleClearDownloadQueue}
        />
      </div>
    </div>
  )
}
