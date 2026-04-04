'use client'

import { clearPodcastDownloadQueueAction } from '@/app/actions/mediaActions'
import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import AudioTracksTable from '@/components/widgets/AudioTracksTable'
import ChaptersTable from '@/components/widgets/ChaptersTable'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import EpisodeTable from '@/components/widgets/EpisodeTable'
import ExpandableHtml from '@/components/widgets/ExpandableHtml'
import LibraryFilesTable from '@/components/widgets/LibraryFilesTable'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, BookMetadata, PodcastLibraryItem, PodcastMetadata } from '@/types/api'
import { Fragment, useCallback, useEffect, useState } from 'react'
import LibraryItemActionButtons from './LibraryItemActionButtons'
import LibraryItemCover from './LibraryItemCover'
import LibraryItemDetails from './LibraryItemDetails'

interface LibraryItemClientProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
}

export default function LibraryItemClient({ libraryItem: initialLibraryItem }: LibraryItemClientProps) {
  const { library } = useLibrary()
  const { serverSettings, getLibraryItemProgress, userCanUpdate, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const t = useTypeSafeTranslations()

  const [libraryItem, setLibraryItem] = useState(initialLibraryItem)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isClearQueueDialogOpen, setIsClearQueueDialogOpen] = useState(false)

  useEffect(() => {
    setLibraryItem(initialLibraryItem)
  }, [initialLibraryItem])

  const isPodcast = libraryItem.mediaType === 'podcast'
  const metadata = libraryItem.media.metadata as BookMetadata | PodcastMetadata
  const podcastAuthor = 'author' in metadata ? metadata.author : undefined
  const subtitle = 'subtitle' in metadata ? metadata.subtitle : undefined
  const bookAuthors = 'authors' in metadata ? metadata.authors || [] : []
  const bookSeries = 'series' in metadata ? metadata.series || [] : []
  const description = 'description' in metadata ? metadata.description : undefined

  const userProgress = getLibraryItemProgress(libraryItem.id)

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  const handleItemSaved = (updatedItem: BookLibraryItem | PodcastLibraryItem) => {
    setLibraryItem(updatedItem)
  }

  const { rssFeed, episodesDownloading, episodeDownloadsQueued } = useItemPageSocket({
    libraryItemId: libraryItem.id,
    mediaId: libraryItem.media?.id,
    isPodcast,
    onItemUpdated: handleItemSaved,
    initialRssFeed: initialLibraryItem.rssFeed ?? null
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

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="mx-auto flex w-full max-w-72 flex-shrink-0 items-start justify-center md:w-52 md:max-w-52 md:justify-start">
            <LibraryItemCover
              libraryItem={libraryItem}
              coverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              canUpdate={userCanUpdate}
              mediaProgress={userProgress}
              onEdit={() => {
                console.log('edit cover')
              }}
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
                        <a href={`/library/${library.id}/series/${series.id}`} className="text-foreground-muted text-lg hover:underline">
                          {series.name}
                          {series.sequence && <span className="text-foreground-muted text-lg"> #{series.sequence}</span>}
                        </a>
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
                        <a href={`/library/${library.id}/authors/${author.id}`} className="text-foreground text-lg hover:underline md:text-xl">
                          {author.name}
                        </a>
                        {index < bookAuthors.length - 1 && <span className="text-foreground text-lg md:text-xl">, </span>}
                      </Fragment>
                    )
                  })}
                </div>
              )}
            </div>

            <LibraryItemDetails libraryItem={libraryItem} />

            <LibraryItemActionButtons libraryItem={libraryItem} onEdit={handleOpenEditModal} rssFeed={rssFeed ?? null} />

            {/* Podcast episode downloads queue */}
            {episodeDownloadsQueued.length > 0 && (
              <div className="bg-info/40 relative mx-auto mt-4 max-w-max rounded-md px-4 py-2 text-sm font-semibold text-gray-100 md:mx-0">
                <div className="flex items-center">
                  <p className="py-1 text-sm">{t('MessageEpisodesQueuedForDownload', { count: episodeDownloadsQueued.length })}</p>
                  {userIsAdminOrUp && (
                    <button
                      type="button"
                      aria-label="Clear episode download queue"
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
                    <p className="py-1 pl-4 text-sm">{`${t('MessageDownloadingEpisode')} "${episode.episodeDisplayTitle ?? ''}"`}</p>
                  </div>
                ))}
              </div>
            )}

            {description && <ExpandableHtml html={description} lineClamp={4} className="mt-6" />}

            <div className="mt-6 flex flex-col gap-4">
              {/* chapters table */}
              {libraryItem.mediaType === 'book' && (libraryItem.media.chapters?.length ?? 0) > 0 && (
                <ChaptersTable libraryItem={libraryItem as BookLibraryItem} />
              )}

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
                />
              )}

              {/* library files table */}
              {!isPodcast && (libraryItem.libraryFiles?.length ?? 0) > 0 && <LibraryFilesTable libraryItem={libraryItem} />}
            </div>
          </div>
        </div>
      </div>

      <LibraryItemEditModal isOpen={isEditModalOpen} libraryItem={libraryItem} onClose={handleCloseEditModal} onSaved={handleItemSaved} />
      <ConfirmDialog
        isOpen={isClearQueueDialogOpen}
        message="Are you sure you want to clear episode download queue?"
        onClose={() => setIsClearQueueDialogOpen(false)}
        onConfirm={handleClearDownloadQueue}
      />
    </div>
  )
}
