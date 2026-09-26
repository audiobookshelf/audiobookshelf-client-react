'use client'

import { fetchPodcastFeedAction, getPodcastItemForFeedBrowserAction } from '@/app/actions/mediaActions'
import { EpisodeFeedList } from '@/components/modals/EpisodeFeedModal'
import { PodcastCheckNewEpisodesForm } from '@/components/modals/PodcastCheckNewEpisodesForm'
import { PodcastDownloadScheduleForm } from '@/components/modals/PodcastDownloadScheduleForm'
import PodcastRssActionsModal, { type PodcastRssActionSection } from '@/components/modals/PodcastRssActionsModal'
import Btn from '@/components/ui/Btn'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { isPodcastLibraryItem, type PodcastLibraryItem, type RssPodcastEpisode } from '@/types/api'
import { useCallback, useEffect, useState } from 'react'

/**
 * What the Find Episodes section is currently showing.
 *
 * `noFeed` and `failed` are kept as kinds rather than translated strings so the
 * loading effect does not depend on the translation function.
 */
type FindEpisodesState =
  | { status: 'loading' }
  | { status: 'ready'; libraryItem: PodcastLibraryItem; episodes: RssPodcastEpisode[] }
  | { status: 'empty' }
  | { status: 'error'; reason: 'noFeed' | 'failed' }

interface FindEpisodesPanelProps {
  /** Podcast whose source RSS feed will be requested. */
  libraryItem: PodcastLibraryItem
  /** Closes the whole manager, as the other two sections do after they finish. */
  onClose: () => void
}

/**
 * Loads the source RSS feed and embeds the existing episode browser.
 *
 * The section shows a loading indicator while the feed is being fetched and
 * then renders {@link EpisodeFeedList} in place. It deliberately opens no
 * nested dialog: the manager's own section panel is the container.
 *
 * Mounting this panel means the section is active. `Modal` renders nothing
 * while closed and `SectionedModalBody` renders no children on the mobile hub,
 * so the feed is requested exactly when the user reaches the section, and
 * leaving it unmounts the panel.
 */
function FindEpisodesPanel({ libraryItem, onClose }: FindEpisodesPanelProps) {
  const t = useTypeSafeTranslations()
  const [state, setState] = useState<FindEpisodesState>({ status: 'loading' })
  // Bumped by Retry to re-run the loading effect after a failed request.
  const [reloadCount, setReloadCount] = useState(0)

  const podcastId = libraryItem.id
  const feedUrl = libraryItem.media.metadata.feedUrl ?? ''

  useEffect(() => {
    if (!feedUrl) {
      setState({ status: 'error', reason: 'noFeed' })
      return
    }

    // A server action cannot be cancelled once started. Ignore its result when
    // the section is left, the podcast's feed changes, or Retry supersedes it,
    // so a late response can never replace the current view.
    let ignoreResult = false
    setState({ status: 'loading' })

    const loadFeed = async () => {
      try {
        const itemWithDownloads = await getPodcastItemForFeedBrowserAction(podcastId)
        if (ignoreResult) return
        if (!isPodcastLibraryItem(itemWithDownloads)) throw new Error('Expected a podcast library item')

        // Use the authoritative URL from the expanded item. A card can retain
        // an older URL after podcast metadata changes in another session.
        const currentFeedUrl = itemWithDownloads.media.metadata.feedUrl
        if (!currentFeedUrl) {
          setState({ status: 'error', reason: 'noFeed' })
          return
        }

        const response = await fetchPodcastFeedAction(currentFeedUrl)
        if (ignoreResult) return

        const feedEpisodes = response.podcast.episodes ?? []
        if (feedEpisodes.length === 0) {
          setState({ status: 'empty' })
          return
        }
        setState({ status: 'ready', libraryItem: itemWithDownloads, episodes: feedEpisodes })
      } catch (error) {
        if (ignoreResult) return
        console.error('Failed to fetch podcast RSS feed', error)
        setState({ status: 'error', reason: 'failed' })
      }
    }

    loadFeed()

    return () => {
      ignoreResult = true
    }
  }, [feedUrl, podcastId, reloadCount])

  if (state.status === 'ready') {
    return (
      <EpisodeFeedList
        onClose={onClose}
        libraryItem={state.libraryItem}
        episodes={state.episodes}
        downloadQueue={state.libraryItem.episodeDownloadsQueued ?? []}
        episodesDownloading={state.libraryItem.episodesDownloading ?? []}
        className="min-h-0 flex-1"
      />
    )
  }

  return (
    <div cy-id="find-episodes-status" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      {state.status === 'loading' && <LoadingIndicator variant="inline" />}
      {state.status === 'empty' && <p className="text-foreground-muted">{t('ToastPodcastNoEpisodesInFeed')}</p>}
      {state.status === 'error' && (
        <>
          <p className="text-foreground-muted">{state.reason === 'noFeed' ? t('ToastPodcastNoRssFeed') : t('ToastPodcastGetFeedFailed')}</p>
          {state.reason === 'failed' && <Btn onClick={() => setReloadCount((count) => count + 1)}>{t('ButtonRetry')}</Btn>}
        </>
      )}
    </div>
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
 * Every section embeds the body of an existing dialog rather than launching it,
 * so the behaviour here and in the standalone dialogs cannot drift apart.
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
      if (section === 'find-episodes') return <FindEpisodesPanel libraryItem={libraryItem} onClose={onClose} />
      return <PodcastCheckNewEpisodesForm libraryItem={libraryItem} onClose={onClose} />
    },
    [libraryItem, onClose]
  )

  return <PodcastRssActionsModal isOpen={isOpen} onClose={onClose} processing={isSavingSchedule} renderSection={renderSection} />
}
