'use client'

import { toggleMediaFinished, updateLibraryItemAction } from '@/app/actions/libraryItemActions'
import CoverEditModal from '@/components/modals/CoverEditModal'
import MatchModal from '@/components/modals/MatchModal'
import AudioTracksAccordion from '@/components/widgets/AudioTracksAccordion'
import Chapters from '@/components/widgets/Chapters'
import EpisodesAccordion from '@/components/widgets/EpisodesAccordion'
import LibraryFilesAccordion from '@/components/widgets/LibraryFilesAccordion'
import { useItemPageSocket } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  Author,
  BookLibraryItem,
  MediaProgress,
  PodcastEpisode,
  PodcastLibraryItem,
  Series,
  UpdateLibraryItemMediaPayload,
  UserLoginResponse
} from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import BookDetailsSection, { getAvailableOptionalFields, getPopulatedFields } from './BookDetailsSection'
import ItemActionButtons from './ItemActionButtons'
import ItemCover from './ItemCover'
import PodcastDetailsSection, {
  getAvailableOptionalFields as getPodcastAvailableOptionalFields,
  getPopulatedFields as getPodcastPopulatedFields
} from './PodcastDetailsSection'
import ProgressCard from './ProgressCard'
// import ToolsAccordion from './ToolsAccordion'

import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'

import IconBtn from '@/components/ui/IconBtn'
import { useItemNavigation } from '@/hooks/useItemNavigation'
import { useRouter, useSearchParams } from 'next/navigation'

interface LibraryItemClientProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  currentUser: UserLoginResponse
  mediaProgress?: MediaProgress | null
}

export default function LibraryItemClient({ libraryItem: initialLibraryItem, currentUser, mediaProgress = null }: LibraryItemClientProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contextIndex = parseInt(searchParams.get('contextIndex') || '', 10)

  // Navigation context hook
  const { prevId, nextId, loading } = useItemNavigation(initialLibraryItem)

  // Navigate to item while preserving context params
  const handleNavigate = (itemId: string, newIndex?: number) => {
    if (!itemId) return
    const currentParams = new URLSearchParams(searchParams.toString())
    if (typeof newIndex === 'number') {
      currentParams.set('contextIndex', String(newIndex))
    }
    router.push(`/library/${initialLibraryItem.libraryId}/item/${itemId}?${currentParams.toString()}`)
  }

  const context = searchParams.get('context')
  const contextId = searchParams.get('contextId')
  const showNavigation = context && (loading || prevId || nextId || context)

  const handleUpNavigation = () => {
    if (!context) return
    let url = ''
    const currentParams = new URLSearchParams()

    // Pass focus index or id
    if (!isNaN(contextIndex)) {
      currentParams.set('focusIndex', String(contextIndex))
    }

    if (context === 'library') {
      // Library context: /library/[libId]/items
      // BookshelfClient expects 'items', 'series', 'collections', etc.
      url = `/library/${initialLibraryItem.libraryId}/items`
    } else if (context === 'series' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}/series/${contextId}`
    } else if (context === 'books-in-series' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}/series/${contextId}`
    } else if (context === 'collection' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}/collection/${contextId}`
    } else if (context === 'playlist' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}/playlist/${contextId}`
    } else if (context === 'author' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}/authors/${contextId}`
    } else if (context === 'personalized' && contextId) {
      url = `/library/${initialLibraryItem.libraryId}`
      currentParams.set('focusShelf', contextId)
    }

    if (url) {
      const queryString = currentParams.toString()
      router.push(queryString ? `${url}?${queryString}` : url)
    }
  }

  // State for real-time updates
  const [libraryItem, setLibraryItem] = useState<BookLibraryItem | PodcastLibraryItem>(initialLibraryItem)
  const [isCoverEditModalOpen, setIsCoverEditModalOpen] = useState(false)
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [bookVisibleFields, setBookVisibleFields] = useState<Set<string>>(new Set())
  const [bookFieldToAutoEdit, setBookFieldToAutoEdit] = useState<string | null>(null)

  const [podcastVisibleFields, setPodcastVisibleFields] = useState<Set<string>>(new Set())
  const [podcastFieldToAutoEdit, setPodcastFieldToAutoEdit] = useState<string | null>(null)

  const isBook = libraryItem.mediaType === 'book'
  const isPodcast = libraryItem.mediaType === 'podcast'
  const user = currentUser.user
  const { filterData, library } = useLibrary()
  const { showToast } = useGlobalToast()

  // Sync state with props when data is refreshed (e.g. after router.refresh())
  useEffect(() => {
    setLibraryItem(initialLibraryItem)
    if (initialLibraryItem.mediaType === 'book') {
      const bookItem = initialLibraryItem as BookLibraryItem
      const meta = bookItem.media.metadata
      const tags = bookItem.media.tags || []
      setBookVisibleFields(getPopulatedFields(meta, tags))
    } else if (initialLibraryItem.mediaType === 'podcast') {
      const podcastItem = initialLibraryItem as PodcastLibraryItem
      const meta = podcastItem.media.metadata
      const tags = podcastItem.media.tags || []
      setPodcastVisibleFields(getPodcastPopulatedFields(meta, tags))
    }
  }, [initialLibraryItem])

  const userCanUpdate = user.permissions?.update || user.type === 'admin' || user.type === 'root'
  const coverAspectRatio = library.settings?.coverAspectRatio || 1.6

  // Handle real-time item updates
  const handleItemUpdated = useCallback((updatedItem: BookLibraryItem | PodcastLibraryItem) => {
    setLibraryItem(updatedItem)

    // Update visible fields based on new data
    if (updatedItem.mediaType === 'book') {
      const bookItem = updatedItem as BookLibraryItem
      const meta = bookItem.media.metadata
      const tags = bookItem.media.tags || []
      const newFields = getPopulatedFields(meta, tags)
      setBookVisibleFields((prev) => new Set([...prev, ...newFields]))
    } else if (updatedItem.mediaType === 'podcast') {
      const podcastItem = updatedItem as PodcastLibraryItem
      const meta = podcastItem.media.metadata
      const tags = podcastItem.media.tags || []
      const newFields = getPodcastPopulatedFields(meta, tags)
      setPodcastVisibleFields((prev) => new Set([...prev, ...newFields]))
    }
  }, [])

  const handleToggleCoverEdit = useCallback(() => {
    setIsCoverEditModalOpen((prev) => !prev)
  }, [])

  const handleToggleMatchModal = useCallback(() => {
    setIsMatchModalOpen((prev) => !prev)
  }, [])

  const handleQuickMatchClick = useCallback(() => {
    console.log('Quick match clicked')
  }, [])

  const handleAddBookField = useCallback((key: string) => {
    setBookVisibleFields((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setBookFieldToAutoEdit(key)
  }, [])

  const handleAddPodcastField = useCallback((key: string) => {
    setPodcastVisibleFields((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setPodcastFieldToAutoEdit(key)
  }, [])

  // Socket event listeners for real-time updates
  const { rssFeed, mediaItemShare, episodesDownloading, episodeDownloadsQueued } = useItemPageSocket({
    libraryItemId: libraryItem.id,
    mediaId: libraryItem.media.id,
    isPodcast,
    onItemUpdated: handleItemUpdated
  })

  // Handle episode download
  const handleDownloadEpisode = useCallback((episode: PodcastEpisode) => {
    // TODO: Implement download via API
    console.log('Download episode:', episode.id)
  }, [])

  // Calculate duration for progress display
  const duration = useMemo(() => {
    if (isBook) {
      return (libraryItem as BookLibraryItem).media.duration || 0
    } else if (isPodcast) {
      const episodes = (libraryItem as PodcastLibraryItem).media.episodes || []
      return episodes.reduce((acc, ep) => acc + (ep.audioTrack?.duration || 0), 0)
    }
    return 0
  }, [isBook, isPodcast, libraryItem])

  // Prepare filter data for edit mode
  const availableAuthors = useMemo(() => (filterData?.authors || []).map((a: Author) => ({ value: a.id || a.name, content: a.name })), [filterData?.authors])
  const availableNarrators = useMemo(() => (filterData?.narrators || []).map((n: string) => ({ value: n, content: n })), [filterData?.narrators])
  const availableGenres = useMemo(() => (filterData?.genres || []).map((g: string) => ({ value: g, content: g })), [filterData?.genres])
  const availableTags = useMemo(() => (filterData?.tags || []).map((tag: string) => ({ value: tag, content: tag })), [filterData?.tags])
  const availableSeries = useMemo(() => (filterData?.series || []).map((s: Series) => ({ value: s.id || s.name, content: s.name })), [filterData?.series])

  const handleSaveDetails = async (updatePayload: UpdateLibraryItemMediaPayload) => {
    try {
      const response = await updateLibraryItemAction(libraryItem.id, updatePayload)
      if (!response.updated) {
        console.warn('Library item update returned false for updated', response)
      }
      if (!response.updated) {
        console.warn('Library item update returned false for updated', response)
      }
      router.refresh()
    } catch (error) {
      console.error('Failed to update item', error)
      showToast(t('ErrorUnknown'), { type: 'error' })
    }
  }

  const handleResetProgress = async () => {
    // TODO: Implement reset progress via server action
    console.log('Reset progress')
  }

  const handleToggleFinished = async (isFinished: boolean) => {
    try {
      await toggleMediaFinished(libraryItem.id, isFinished)
      // Optimistic update or wait for socket? Socket will update item.
    } catch (error) {
      console.error('Failed to toggle finished', error)
    }
  }

  return (
    <div className="pb-8 bg-none">
      <div className="w-full max-w-6xl mx-auto">
        {/* Navigation Buttons */}
        {/* Navigation Buttons REMOVED - moved to action bar and title line */}

        {/* Main content: Cover + Details */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Cover column */}
          <div className="w-full md:w-62 md:max-w-62 flex-shrink-0">
            <ItemCover
              libraryItem={libraryItem}
              bookCoverAspectRatio={coverAspectRatio}
              canUpdate={userCanUpdate}
              mediaProgress={mediaProgress}
              isExpanded={false}
              onToggleExpand={handleToggleCoverEdit}
            />

            {/* Navigation Buttons - Below Cover */}
            {(prevId || nextId || showNavigation) && (
              <div className="flex justify-between mt-4">
                <div className={!prevId ? 'invisible' : ''}>
                  <IconBtn
                    ariaLabel={t('ButtonPrevious')}
                    onClick={() => {
                      if (prevId) {
                        const newIndex = !isNaN(contextIndex) ? contextIndex - 1 : undefined
                        handleNavigate(prevId, newIndex)
                      }
                    }}
                    className="bg-primary hover:bg-bg-hover border border-white/10"
                  >
                    arrow_back
                  </IconBtn>
                </div>

                <div className="flex items-center gap-2">
                  {showNavigation && (
                    <IconBtn ariaLabel={t('ButtonClose')} onClick={handleUpNavigation} className="bg-primary hover:bg-bg-hover border border-white/10">
                      close
                    </IconBtn>
                  )}

                  <div className={!nextId ? 'invisible' : ''}>
                    <IconBtn
                      ariaLabel={t('ButtonNext')}
                      onClick={() => {
                        if (nextId) {
                          const newIndex = !isNaN(contextIndex) ? contextIndex + 1 : undefined
                          handleNavigate(nextId, newIndex)
                        }
                      }}
                      className="bg-primary hover:bg-bg-hover border border-white/10"
                    >
                      arrow_forward
                    </IconBtn>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details column */}
          <div className="flex-1 min-w-0">
            {/* Edit Cover Modal */}
            <CoverEditModal
              isOpen={isCoverEditModalOpen}
              onClose={() => setIsCoverEditModalOpen(false)}
              libraryItem={libraryItem}
              user={user}
              bookCoverAspectRatio={coverAspectRatio}
            />

            {/* Match Modal */}
            <MatchModal
              isOpen={isMatchModalOpen}
              onClose={() => setIsMatchModalOpen(false)}
              libraryItem={libraryItem}
              bookCoverAspectRatio={coverAspectRatio}
            />

            {/* Book or Podcast details section */}
            {isBook ? (
              <BookDetailsSection
                libraryItem={libraryItem as BookLibraryItem}
                availableAuthors={availableAuthors}
                availableNarrators={availableNarrators}
                availableGenres={availableGenres}
                availableTags={availableTags}
                availableSeries={availableSeries}
                onSave={handleSaveDetails}
                visibleFields={bookVisibleFields}
                setVisibleFields={setBookVisibleFields}
                fieldToAutoEdit={bookFieldToAutoEdit}
              />
            ) : (
              <PodcastDetailsSection
                libraryItem={libraryItem as PodcastLibraryItem}
                availableGenres={availableGenres}
                availableTags={availableTags}
                onSave={handleSaveDetails}
                visibleFields={podcastVisibleFields}
                setVisibleFields={setPodcastVisibleFields}
                fieldToAutoEdit={podcastFieldToAutoEdit}
              />
            )}

            {/* Additional details (narrators, genres, etc) - shown in view mode */}
            {/* REMOVED LibraryItemDetails usage, now integrated into *DetailsSection */}
            {/* {!isDetailsEditOpen && <LibraryItemDetails libraryItem={libraryItem} />} */}

            {/* Progress Card matches design of action buttons area */}
            {mediaProgress && (
              <div className="mt-4">
                <ProgressCard progress={mediaProgress} duration={duration} onResetProgress={handleResetProgress} />
              </div>
            )}

            {/* Action buttons */}
            <ItemActionButtons
              libraryItem={libraryItem}
              user={user}
              mediaProgress={mediaProgress}
              rssFeed={rssFeed}
              mediaItemShare={mediaItemShare}
              onToggleFinished={handleToggleFinished}
              onContextMenuAction={(action) => console.log('Context menu action:', action)}
              availableAddFields={
                isBook
                  ? getAvailableOptionalFields(t).filter(
                      (f) => !bookVisibleFields.has(f.key) && !(f.key === 'series' && (libraryItem as BookLibraryItem).media.metadata?.series?.length)
                    )
                  : isPodcast
                    ? getPodcastAvailableOptionalFields(t).filter((f) => !podcastVisibleFields.has(f.key))
                    : undefined
              }
              onAddField={isBook ? handleAddBookField : isPodcast ? handleAddPodcastField : undefined}
              onMatchClick={handleToggleMatchModal}
              onQuickMatchClick={handleQuickMatchClick}
            />
          </div>
        </div>

        {/* Tables section */}
        <div className="mt-8 flex flex-col gap-4">
          {/* Chapters table - books only */}
          {isBook && ((libraryItem as BookLibraryItem).media.chapters?.length ?? 0) > 0 && (
            <Chapters libraryItem={libraryItem as BookLibraryItem} user={user} className="my-0" />
          )}

          {/* Audio tracks table - books only */}
          {isBook && ((libraryItem as BookLibraryItem).media.tracks?.length ?? 0) > 0 && (
            <AudioTracksAccordion libraryItem={libraryItem as BookLibraryItem} user={user} className="my-0" />
          )}

          {/* Podcast episodes table - podcasts only */}
          {isPodcast && ((libraryItem as PodcastLibraryItem).media.episodes?.length ?? 0) > 0 && (
            <EpisodesAccordion
              libraryItem={libraryItem as PodcastLibraryItem}
              user={user}
              getEpisodeProgress={(epId) => (mediaProgress?.episodeId === epId ? mediaProgress : null)}
              episodesDownloading={episodesDownloading}
              episodeDownloadsQueued={episodeDownloadsQueued}
              onDownloadEpisode={handleDownloadEpisode}
              onFindEpisodes={() => console.log('Find episodes clicked')}
              className="my-0 py-0"
            />
          )}

          {/* Library files table */}
          {(libraryItem.libraryFiles?.length ?? 0) > 0 && <LibraryFilesAccordion libraryItem={libraryItem} user={user} className="my-0" />}

          {/* Tools & Match accordions - only for users with update permission */}
          {/* REMOVED ToolsAccordion */}
          {/* {userCanUpdate && (<><ToolsAccordion libraryItem={libraryItem} /></>)} */}
        </div>
      </div>
    </div>
  )
}
