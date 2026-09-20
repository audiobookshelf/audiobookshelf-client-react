'use client'

import EpisodeFeedModal from '@/components/modals/EpisodeFeedModal'
import { fetchPodcastFeedAction, getPodcastItemForFeedBrowserAction } from '@/app/actions/mediaActions'
import { PodcastCheckNewEpisodesForm } from '@/components/modals/PodcastCheckNewEpisodesModal'
import { PodcastDownloadScheduleForm } from '@/components/modals/PodcastDownloadScheduleModal'
import PodcastRssActionsModal, { type PodcastRssActionSection } from '@/components/modals/PodcastRssActionsModal'
import Btn from '@/components/ui/Btn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isPodcastLibraryItem, type PodcastLibraryItem, type RssPodcastEpisode } from '@/types/api'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

interface FindEpisodesPanelProps {
  /** Podcast whose source RSS feed will be requested. */
  libraryItem: PodcastLibraryItem
  /** Parent manager visibility used to suppress late request results. */
  managerIsOpen: boolean
}

/** Loads the feed and opens the existing RSS episode browser. */
function FindEpisodesPanel({ libraryItem, managerIsOpen }: FindEpisodesPanelProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [episodes, setEpisodes] = useState<RssPodcastEpisode[]>([])
  const [viewerItem, setViewerItem] = useState<PodcastLibraryItem | null>(null)
  const [isEpisodeFeedModalOpen, setIsEpisodeFeedModalOpen] = useState(false)
  const requestGeneration = useRef(0)
  const feedUrl = libraryItem.media.metadata.feedUrl ?? ''

  // A server action cannot be cancelled once started. Invalidate its result
  // when the panel closes or unmounts so a late response cannot reopen a child
  // modal after the user has dismissed the RSS manager.
  useEffect(() => {
    if (!managerIsOpen) {
      requestGeneration.current += 1
      setIsEpisodeFeedModalOpen(false)
    }
  }, [managerIsOpen])

  useEffect(() => {
    return () => {
      requestGeneration.current += 1
    }
  }, [])

  // The selected podcast or feed can change while a server action is pending.
  // Invalidate that response so the viewer never shows episodes for the old URL.
  useEffect(() => {
    requestGeneration.current += 1
    setIsEpisodeFeedModalOpen(false)
  }, [libraryItem.id, feedUrl])

  const findEpisodes = useCallback(() => {
    if (!feedUrl) {
      showToast(t('ToastPodcastNoRssFeed'), { type: 'error' })
      return
    }

    const generation = ++requestGeneration.current
    startTransition(async () => {
      try {
        const itemWithDownloads = await getPodcastItemForFeedBrowserAction(libraryItem.id)
        if (generation !== requestGeneration.current || !managerIsOpen) return
        if (!isPodcastLibraryItem(itemWithDownloads)) throw new Error('Expected a podcast library item')
        const currentFeedUrl = itemWithDownloads.media.metadata.feedUrl
        if (!currentFeedUrl) {
          showToast(t('ToastPodcastNoRssFeed'), { type: 'error' })
          return
        }

        // Use the authoritative URL from the expanded item. A card can retain
        // an older URL after podcast metadata changes in another session.
        const response = await fetchPodcastFeedAction(currentFeedUrl)
        const feedEpisodes = response.podcast.episodes ?? []
        if (generation !== requestGeneration.current || !managerIsOpen) return
        if (feedEpisodes.length === 0) {
          showToast(t('ToastPodcastNoEpisodesInFeed'), { type: 'info' })
          return
        }
        setViewerItem(itemWithDownloads)
        setEpisodes(feedEpisodes)
        setIsEpisodeFeedModalOpen(true)
      } catch (error) {
        if (generation !== requestGeneration.current || !managerIsOpen) return
        console.error('Failed to fetch podcast RSS feed', error)
        showToast(t('ToastPodcastGetFeedFailed'), { type: 'error' })
      }
    })
  }, [feedUrl, libraryItem.id, managerIsOpen, showToast, t])

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t('LabelFindEpisodes')}</h2>
            <p className="text-foreground-muted mt-1 text-sm">{feedUrl}</p>
          </div>
          <Btn onClick={findEpisodes} loading={isPending} disabled={!feedUrl} className="self-start">
            {t('LabelFindEpisodes')}
          </Btn>
        </div>
      </div>
      {viewerItem && (
        <EpisodeFeedModal
          isOpen={isEpisodeFeedModalOpen}
          onClose={() => setIsEpisodeFeedModalOpen(false)}
          libraryItem={viewerItem}
          episodes={episodes}
          downloadQueue={viewerItem.episodeDownloadsQueued ?? []}
          episodesDownloading={viewerItem.episodesDownloading ?? []}
        />
      )}
    </>
  )
}

/**
 * Production composition for the RSS manager. The navigator itself stays
 * presentational; this wrapper owns the operation components and their data.
 */
export interface PodcastRssActionsFeatureProps {
  /** Controls the visibility of the grouped RSS manager. */
  isOpen: boolean
  /** Closes the grouped RSS manager. */
  onClose: () => void
  /** Podcast item supplying feed metadata and operation state. */
  libraryItem: PodcastLibraryItem
}

/**
 * Composes the section navigator with the three existing RSS operation bodies.
 *
 * Schedule and Check for New Episodes reuse the same form components their
 * standalone dialogs render, so the behaviour here and in those dialogs cannot
 * drift apart.
 */
export default function PodcastRssActionsFeature({ isOpen, onClose, libraryItem }: PodcastRssActionsFeatureProps) {
  // The standalone schedule dialog blocked dismissal while a save was in
  // flight. The manager owns the dialog now, so it has to receive the same
  // signal or Escape would close the modal mid-request.
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const renderSection = useCallback(
    (section: PodcastRssActionSection) => {
      if (section === 'schedule') {
        return <PodcastDownloadScheduleForm libraryItem={libraryItem} onClose={onClose} onProcessingChange={setIsSavingSchedule} />
      }
      if (section === 'find-episodes') return <FindEpisodesPanel libraryItem={libraryItem} managerIsOpen={isOpen} />
      return <PodcastCheckNewEpisodesForm libraryItem={libraryItem} onClose={onClose} />
    },
    [isOpen, libraryItem, onClose]
  )

  return <PodcastRssActionsModal isOpen={isOpen} onClose={onClose} processing={isSavingSchedule} renderSection={renderSection} />
}
