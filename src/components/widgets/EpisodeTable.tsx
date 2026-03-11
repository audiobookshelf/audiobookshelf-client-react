'use client'

import { batchUpdateMediaFinishedAction, deleteLibraryItemMediaEpisodeAction, toggleFinishedAction } from '@/app/actions/mediaActions'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import ViewEpisodeModal from '@/components/modals/ViewEpisodeModal'
import EpisodeRow, { EPISODE_ROW_HEIGHT_PX } from '@/components/widgets/EpisodeRow'
import EpisodeTableHeaderActions from '@/components/widgets/EpisodeTableHeaderActions'
import EpisodeTableToolbar from '@/components/widgets/EpisodeTableToolbar'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useMediaContext } from '@/contexts/MediaContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useEpisodeFilterAndSort } from '@/hooks/useEpisodeFilterAndSort'
import { useEpisodeTableVirtualizer } from '@/hooks/useEpisodeTableVirtualizer'
import { EpisodeDownload } from '@/hooks/useItemPageSocket'
import { useLibraryFileActions } from '@/hooks/useLibraryFileActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { MediaProgress, PodcastEpisode, PodcastLibraryItem } from '@/types/api'
import { useLocale } from 'next-intl'
import { useCallback, useMemo, useState, useTransition } from 'react'

interface EpisodeTableProps {
  libraryItem: PodcastLibraryItem
  /** Date format from server settings */
  dateFormat?: string
  episodesDownloading?: EpisodeDownload[]
  episodeDownloadsQueued?: EpisodeDownload[]
  onFindEpisodes?: () => void
}

/**
 * Table for podcast episodes with advanced filtering, sorting, and management controls.
 */
export default function EpisodeTable({
  libraryItem,
  dateFormat = 'MM/dd/yyyy',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  episodesDownloading = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  episodeDownloadsQueued = [],
  onFindEpisodes
}: EpisodeTableProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const { playItem, isStreaming } = useMediaContext()
  const { showToast } = useGlobalToast()
  const { user } = useUser()
  const [, startTransition] = useTransition()

  // Create a dictionary of progress entries for this library item for O(1) lookup
  const episodeProgressMap = useMemo(() => {
    const map = new Map<string, MediaProgress>()
    for (const p of user.mediaProgress) {
      if (p.libraryItemId === libraryItem.id && p.episodeId) {
        map.set(p.episodeId, p)
      }
    }
    return map
  }, [user, libraryItem.id])

  const getEpisodeProgress = useCallback(
    (episodeId: string) => {
      return episodeProgressMap.get(episodeId) || null
    },
    [episodeProgressMap]
  )

  const userCanUpdate = user.permissions?.update || user.type === 'admin' || user.type === 'root'
  const userCanDelete = user.permissions?.delete || user.type === 'admin' || user.type === 'root'
  const userCanDownload = user.permissions?.download || user.type === 'admin' || user.type === 'root'
  const userIsAdminOrUp = user.type === 'admin' || user.type === 'root'

  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set())
  const [viewedEpisode, setViewedEpisode] = useState<PodcastEpisode | null>(null)

  const { downloadFile, showMoreInfo, audioFileToShow, closeMoreInfo } = useLibraryFileActions(libraryItem.id)

  const episodes = useMemo(() => libraryItem.media.episodes || [], [libraryItem.media.episodes])

  const { filterKey, setFilterKey, sortKey, setSortKey, sortDesc, setSortDesc, search, setSearch, isSearching, filteredEpisodes, hasMounted } =
    useEpisodeFilterAndSort({ libraryItemId: libraryItem.id, episodes, getEpisodeProgress })

  const handleCloseViewModal = useCallback(() => {
    if (viewedEpisode) {
      const targetId = `btn-episode-${viewedEpisode.id}`
      // Need a slight delay to allow the modal to unmount before restoring focus
      setTimeout(() => {
        document.getElementById(targetId)?.focus()
      }, 50)
    }
    setViewedEpisode(null)
  }, [viewedEpisode])

  const isViewEpisodeModalOpen = viewedEpisode !== null

  // Virtualizer — lazy render only visible rows
  const { visibleStart, visibleEnd, totalHeight, listContainerRef } = useEpisodeTableVirtualizer(filteredEpisodes.length, EPISODE_ROW_HEIGHT_PX)

  // Selection mode
  const isSelectionMode = selectedEpisodes.size > 0

  const allEpisodesFinished = useMemo(() => {
    return !filteredEpisodes.some((episode) => {
      const itemProgress = getEpisodeProgress?.(episode.id)
      return !itemProgress?.isFinished
    })
  }, [filteredEpisodes, getEpisodeProgress])

  const handleSelectEpisode = useCallback((episode: PodcastEpisode, isSelected: boolean) => {
    setSelectedEpisodes((prev) => {
      const next = new Set(prev)
      if (isSelected) {
        next.add(episode.id)
      } else {
        next.delete(episode.id)
      }
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedEpisodes(new Set())
  }, [])

  const handlePlayEpisode = useCallback(
    (episode: PodcastEpisode) => {
      playItem({
        libraryItem,
        episodeId: episode.id,
        queueItems: []
      })
    },
    [libraryItem, playItem]
  )

  const handleToggleFinished = useCallback(
    (episode: PodcastEpisode) => {
      const progress = getEpisodeProgress(episode.id)
      const isFinished = progress ? !progress.isFinished : true

      startTransition(async () => {
        try {
          await toggleFinishedAction(libraryItem.id, {
            isFinished,
            episodeId: episode.id
          })
        } catch (error) {
          console.error('Failed to update media finished state', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [libraryItem.id, getEpisodeProgress, showToast, t]
  )

  const handleViewEpisode = useCallback((episode: PodcastEpisode) => {
    setViewedEpisode(episode)
  }, [])

  const handleEditEpisode = useCallback((episode: PodcastEpisode) => {
    // TODO: Open episode edit modal
    console.log('Edit episode:', episode.id)
  }, [])

  const handleDownloadFile = useCallback(
    (episode: PodcastEpisode) => {
      if (episode.audioFile) {
        downloadFile(episode.audioFile.ino, episode.audioFile.metadata.filename)
      }
    },
    [downloadFile]
  )

  const handleShowMoreInfo = useCallback(
    (episode: PodcastEpisode) => {
      if (episode.audioFile) {
        showMoreInfo(episode.audioFile)
      }
    },
    [showMoreInfo]
  )

  const handleRemoveEpisode = useCallback(
    (episode: PodcastEpisode, hardDelete: boolean) => {
      startTransition(async () => {
        try {
          await deleteLibraryItemMediaEpisodeAction(libraryItem.id, episode.id, hardDelete)
        } catch (err: unknown) {
          console.error('Failed to remove episode', err)
          showToast(t('ToastItemDeletedFailed'), { type: 'error' })
        }
      })
    },
    [libraryItem.id, t, showToast]
  )

  const handleAddToPlaylist = useCallback(() => {
    // NOTE: Not natively implemented yet
    showToast('This action is not implemented yet.', { type: 'info' })
  }, [showToast])

  const contextMenuItems = useMemo(() => {
    const items = []
    if (userIsAdminOrUp) {
      items.push({ text: t('MessageQuickMatchAllEpisodes'), action: 'quick-match-episodes' })
    }
    items.push({
      text: allEpisodesFinished ? t('MessageMarkAllEpisodesNotFinished') : t('MessageMarkAllEpisodesFinished'),
      action: 'batch-mark-as-finished'
    })
    return items
  }, [userIsAdminOrUp, allEpisodesFinished, t])

  const handleContextMenuAction = useCallback(
    (action: string) => {
      if (action === 'quick-match-episodes') {
        // TODO: Implement quick match
      } else if (action === 'batch-mark-as-finished') {
        const markState = !allEpisodesFinished

        startTransition(async () => {
          try {
            await batchUpdateMediaFinishedAction(
              filteredEpisodes.map((episode) => ({
                libraryItemId: libraryItem.id,
                episodeId: episode.id,
                isFinished: markState
              }))
            )
          } catch (error) {
            console.error('Failed to batch mark episodes finished state', error)
            showToast(t('ToastFailedToUpdate'), { type: 'error' })
          }
        })
      }
    },
    [allEpisodesFinished, filteredEpisodes, libraryItem.id, showToast, t]
  )

  const allSelectedEpisodesFinished = useMemo(() => {
    if (selectedEpisodes.size === 0) return false
    return Array.from(selectedEpisodes).every((episodeId) => {
      const itemProgress = getEpisodeProgress?.(episodeId)
      return itemProgress?.isFinished
    })
  }, [selectedEpisodes, getEpisodeProgress])

  const headerActions = useMemo(
    () => (
      <EpisodeTableHeaderActions
        isSelectionMode={isSelectionMode}
        selectedEpisodes={selectedEpisodes}
        allSelectedEpisodesFinished={allSelectedEpisodesFinished}
        libraryItemId={libraryItem.id}
        onClearSelection={handleClearSelection}
        onFindEpisodes={onFindEpisodes}
      />
    ),
    [isSelectionMode, selectedEpisodes, allSelectedEpisodesFinished, libraryItem.id, handleClearSelection, onFindEpisodes]
  )

  const isFiltered = hasMounted && filteredEpisodes.length !== episodes.length
  const count = !isFiltered && hasMounted ? episodes.length : undefined
  const badge = isFiltered ? `${filteredEpisodes.length} / ${episodes.length}` : undefined

  const headerNode = (
    <div className="flex items-center w-full px-1 mb-4 pt-1">
      <div className="flex items-center flex-1 min-w-0 gap-3">
        <p className="text-xl font-medium">{t('HeaderEpisodes')}</p>
        {count !== undefined && (
          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-mono">{count}</span>
          </div>
        )}
        {badge && (
          <div className="h-6 px-3 rounded-full bg-white/10 flex items-center justify-center text-sm">
            <span className="font-mono">{badge}</span>
          </div>
        )}
      </div>
      {headerActions && <div className="flex items-center gap-2 m-0">{headerActions}</div>}
    </div>
  )

  if (episodes.length === 0) {
    return null
  }

  if (!hasMounted) {
    return (
      <div className="w-full">
        {headerNode}
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="la-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {headerNode}

      <div className="w-full">
        {/* Toolbar: Filter, Sort, Actions */}
        <EpisodeTableToolbar
          isSelectionMode={isSelectionMode}
          search={search}
          onSearchChange={setSearch}
          filterKey={filterKey}
          onFilterChange={setFilterKey}
          sortKey={sortKey}
          sortDesc={sortDesc}
          onSortChange={(key, desc) => {
            setSortKey(key)
            setSortDesc(desc)
          }}
          contextMenuItems={contextMenuItems}
          onContextMenuAction={handleContextMenuAction}
        />

        {/* Episodes list */}
        <div
          ref={listContainerRef}
          className="relative block"
          style={{ minHeight: filteredEpisodes.length === 0 ? `${EPISODE_ROW_HEIGHT_PX}px` : `${Math.max(totalHeight, EPISODE_ROW_HEIGHT_PX)}px` }}
        >
          {isSearching && (
            <div className="absolute inset-0 z-50 pointer-events-none bg-black/30">
              <div className="absolute top-0 w-full h-44 flex items-center justify-center">
                <LoadingSpinner size="la-lg" />
              </div>
            </div>
          )}

          {filteredEpisodes.length === 0 && !isSearching ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-lg">{t('MessageNoEpisodes')}</p>
            </div>
          ) : (
            filteredEpisodes.slice(visibleStart, visibleEnd).map((episode, i) => {
              const rowIndex = visibleStart + i
              return (
                <div key={episode.id} className="absolute w-full" style={{ top: rowIndex * EPISODE_ROW_HEIGHT_PX }}>
                  <EpisodeRow
                    episode={episode}
                    libraryItemId={libraryItem.id}
                    sortKey={sortKey}
                    progress={getEpisodeProgress?.(episode.id) || null}
                    isSelected={selectedEpisodes.has(episode.id)}
                    isSelectionMode={isSelectionMode}
                    userCanUpdate={userCanUpdate}
                    userCanDelete={userCanDelete}
                    userCanDownload={userCanDownload}
                    dateFormat={dateFormat}
                    locale={locale}
                    onPlay={handlePlayEpisode}
                    onView={handleViewEpisode}
                    onToggleFinished={handleToggleFinished}
                    onSelect={handleSelectEpisode}
                    onEdit={handleEditEpisode}
                    onRemove={handleRemoveEpisode}
                    onDownloadFile={handleDownloadFile}
                    onShowMoreInfo={handleShowMoreInfo}
                    userIsAdmin={userIsAdminOrUp}
                    onAddToPlaylist={handleAddToPlaylist}
                    isStreamingThisEpisode={isStreaming(libraryItem.id, episode.id)}
                    rowIndex={rowIndex}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>

      <ViewEpisodeModal isOpen={isViewEpisodeModalOpen} onClose={handleCloseViewModal} episode={viewedEpisode} libraryItem={libraryItem} />
      <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={closeMoreInfo} />
    </div>
  )
}
