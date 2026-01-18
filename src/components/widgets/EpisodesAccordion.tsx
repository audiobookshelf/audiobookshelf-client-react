'use client'

import AccordionSection from '@/components/ui/AccordionSection'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import ContextMenuDropdown from '@/components/ui/ContextMenuDropdown'
import HeaderActionButton from '@/components/ui/HeaderActionButton'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import EpisodesFilterSelect from '@/components/widgets/EpisodesFilterSelect'
import EpisodesSortSelect from '@/components/widgets/EpisodesSortSelect'
import { useMediaContext } from '@/contexts/MediaContext'
import { EpisodeDownload } from '@/hooks/useItemPageSocket'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { elapsedPretty } from '@/lib/timeUtils'
import { MediaProgress, PodcastEpisode, PodcastLibraryItem, User } from '@/types/api'
import { useLocale } from 'next-intl'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface EpisodesAccordionProps {
  libraryItem: PodcastLibraryItem
  user: User
  /** Get episode progress by episode ID */
  getEpisodeProgress?: (episodeId: string) => MediaProgress | null
  /** Date format from server settings */
  dateFormat?: string
  episodesDownloading?: EpisodeDownload[]
  episodeDownloadsQueued?: EpisodeDownload[]
  onDownloadEpisode?: (episode: PodcastEpisode) => void
  onFindEpisodes?: () => void
  keepOpen?: boolean
  expanded?: boolean
  className?: string
}

interface EpisodeRowProps {
  episode: PodcastEpisode
  libraryItemId: string
  sortKey: string
  progress: MediaProgress | null
  isSelected: boolean
  isSelectionMode: boolean
  userCanUpdate: boolean
  userCanDelete: boolean
  userCanDownload: boolean
  dateFormat: string
  locale: string
  onPlay: (episode: PodcastEpisode) => void
  onToggleFinished: (episode: PodcastEpisode) => void
  onSelect: (episode: PodcastEpisode, isSelected: boolean) => void
  onEdit?: (episode: PodcastEpisode) => void
  onRemove?: (episode: PodcastEpisode) => void
  onDownload?: (episode: PodcastEpisode) => void
  isStreamingThisEpisode: boolean
  isDownloading: boolean
  isQueued: boolean
}

function EpisodeRow({
  episode,
  sortKey,
  progress,
  isSelected,
  isSelectionMode,
  userCanUpdate,
  userCanDelete,
  userCanDownload,
  dateFormat,
  locale,
  isStreamingThisEpisode,
  isDownloading,
  isQueued,
  onPlay,
  onToggleFinished,
  onSelect,
  onEdit,
  onRemove,
  onDownload
}: EpisodeRowProps) {
  const t = useTypeSafeTranslations()
  const [isHovering, setIsHovering] = useState(false)

  const userIsFinished = progress?.isFinished || false
  const progressPercent = progress?.progress || 0
  const streamIsPlaying = isStreamingThisEpisode

  const timeRemaining = useMemo(() => {
    if (streamIsPlaying) return t('ButtonPlaying')
    if (!progress) return elapsedPretty(episode.audioTrack?.duration || 0, locale)
    if (userIsFinished) return t('LabelFinished')

    const duration = progress.duration || episode.audioTrack?.duration || 0
    const remaining = Math.floor(duration - (progress.currentTime || 0))
    return t('LabelTimeLeft', { time: elapsedPretty(remaining, locale) })
  }, [streamIsPlaying, progress, userIsFinished, episode.audioTrack?.duration, t, locale])

  const publishedDate = episode.publishedAt ? formatJsDate(new Date(episode.publishedAt), dateFormat) : ''

  return (
    <div
      className="w-full px-2 py-3 border-b border-white/10 relative cursor-pointer hover:bg-white/5 transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main content */}
      <div className="flex">
        <div className="grow">
          {/* Title */}
          <div dir="auto" className="flex items-center">
            <span className={`text-sm font-semibold ${userIsFinished ? 'text-foreground-muted' : ''}`}>{episode.title}</span>
          </div>

          {/* Subtitle/Description */}
          <div className="h-10 flex items-center mt-1.5 mb-0.5 overflow-hidden">
            <div
              dir="auto"
              className="text-sm text-gray-200 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: episode.subtitle || episode.description || '' }}
            />
          </div>

          {/* Metadata row */}
          <div className="h-8 flex items-center">
            {sortKey === 'audioFile.metadata.filename' ? (
              <p className="text-sm text-gray-300 truncate font-light">
                <strong className="font-bold">{t('LabelFilename')}</strong>: {episode.audioFile?.metadata?.filename}
              </p>
            ) : (
              <div className="w-full inline-flex justify-between max-w-xl gap-4">
                {episode.season && <p className="text-sm text-gray-300">{t('LabelSeasonNumber', { 0: episode.season })}</p>}
                {episode.episode && <p className="text-sm text-gray-300">{t('LabelEpisodeNumber', { 0: episode.episode })}</p>}
                {publishedDate && <p className="text-sm text-gray-300">{t('LabelPublishedDate', { 0: publishedDate })}</p>}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center pt-2 gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPlay(episode)
              }}
              className={`h-8 px-4 border border-white/20 hover:bg-white/10 rounded-full flex items-center justify-center cursor-pointer ${userIsFinished ? 'text-white/40' : ''}`}
            >
              <span className={`material-symbols fill text-2xl ${streamIsPlaying ? '' : 'text-success'}`}>{streamIsPlaying ? 'pause' : 'play_arrow'}</span>
              <span className="pl-2 pr-1 text-sm font-semibold" suppressHydrationWarning>
                {timeRemaining}
              </span>
            </button>

            <Tooltip text={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}>
              <IconBtn
                borderless
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFinished(episode)
                }}
                aria-label={userIsFinished ? t('MessageMarkAsNotFinished') : t('MessageMarkAsFinished')}
              >
                {userIsFinished ? 'check_circle' : 'radio_button_unchecked'}
              </IconBtn>
            </Tooltip>

            {/* Download button */}
            {userCanDownload && !episode.audioFile && (
              <Tooltip text={isDownloading ? t('LabelDownloading') : isQueued ? t('LabelQueued') : t('ButtonDownload')}>
                <IconBtn
                  borderless
                  disabled={isDownloading || isQueued}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload?.(episode)
                  }}
                  className={isDownloading || isQueued ? 'text-warning' : ''}
                >
                  {isDownloading || isQueued ? 'downloading' : 'download'}
                </IconBtn>
              </Tooltip>
            )}

            {userCanUpdate && (
              <IconBtn
                borderless
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(episode)
                }}
              >
                edit
              </IconBtn>
            )}

            {userCanDelete && (
              <IconBtn
                borderless
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove?.(episode)
                }}
              >
                close
              </IconBtn>
            )}
          </div>
        </div>

        {/* Selection checkbox area */}
        {(isHovering || isSelected || isSelectionMode) && (
          <div className="hidden md:flex w-12 min-w-12 items-center justify-center">
            <Checkbox value={isSelected} onChange={(checked) => onSelect(episode, checked)} />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!userIsFinished && progressPercent > 0 && <div className="absolute bottom-0 left-0 h-0.5 bg-warning" style={{ width: `${progressPercent * 100}%` }} />}
    </div>
  )
}

/**
 * Accordion for podcast episodes with advanced filtering, sorting, and management controls.
 */
export default function EpisodesAccordion({
  libraryItem,
  user,
  getEpisodeProgress,
  dateFormat = 'MM/dd/yyyy',
  episodesDownloading = [],
  episodeDownloadsQueued = [],
  onDownloadEpisode,
  onFindEpisodes,
  keepOpen = false,
  expanded: expandedProp = false,
  className
}: EpisodesAccordionProps) {
  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const { playItem, isStreaming } = useMediaContext()
  const [_isPending] = useTransition()

  const userCanUpdate = user.permissions?.update || user.type === 'admin' || user.type === 'root'
  const userCanDelete = user.permissions?.delete || user.type === 'admin' || user.type === 'root'
  const userCanDownload = user.permissions?.download || user.type === 'admin' || user.type === 'root'
  const userIsAdminOrUp = user.type === 'admin' || user.type === 'root'

  const [expanded, setExpanded] = useState(expandedProp)
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set())
  const [filterKey, setFilterKey] = useState<string>('incomplete')
  const [sortKey, setSortKey] = useState<string>('publishedAt')
  const [sortDesc, setSortDesc] = useState(true)
  const [search, setSearch] = useState('')
  const [searchText, setSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Sync expanded state
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  const episodes = useMemo(() => libraryItem.media.episodes || [], [libraryItem.media.episodes])

  // Debounced search
  useEffect(() => {
    setIsSearching(true)
    const timeout = setTimeout(() => {
      setSearchText(search.toLowerCase().trim())
      setIsSearching(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  // Filtered and sorted episodes
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes]

    // Apply filter
    if (filterKey !== 'all') {
      result = result.filter((ep) => {
        const progress = getEpisodeProgress?.(ep.id)
        if (filterKey === 'incomplete') return !progress || !progress.isFinished
        if (filterKey === 'complete') return progress?.isFinished
        return progress && !progress.isFinished // in_progress
      })
    }

    // Apply search
    if (searchText) {
      result = result.filter((ep) => ep.title?.toLowerCase().includes(searchText) || ep.subtitle?.toLowerCase().includes(searchText))
    }

    // Apply sort
    result.sort((a, b) => {
      let aVal: string | number | undefined
      let bVal: string | number | undefined

      switch (sortKey) {
        case 'publishedAt':
          aVal = a.publishedAt || Number.MAX_VALUE
          bVal = b.publishedAt || Number.MAX_VALUE
          break
        case 'title':
          aVal = a.title || ''
          bVal = b.title || ''
          break
        case 'season':
          aVal = a.season || ''
          bVal = b.season || ''
          break
        case 'episode':
          aVal = a.episode || ''
          bVal = b.episode || ''
          break
        default:
          aVal = a.publishedAt || 0
          bVal = b.publishedAt || 0
      }

      const compare = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
      return sortDesc ? -compare : compare
    })

    return result
  }, [episodes, filterKey, sortKey, sortDesc, searchText, getEpisodeProgress])

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

  const handleToggleFinished = useCallback((episode: PodcastEpisode) => {
    // TODO: Implement via server action
    console.log('Toggle finished:', episode.id)
  }, [])

  const handleEditEpisode = useCallback((episode: PodcastEpisode) => {
    // TODO: Open episode edit modal
    console.log('Edit episode:', episode.id)
  }, [])

  const handleRemoveEpisode = useCallback((episode: PodcastEpisode) => {
    // TODO: Open remove episode modal
    console.log('Remove episode:', episode.id)
  }, [])

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

  const handleContextMenuAction = useCallback((action: string) => {
    console.log('Context menu action:', action)
    if (action === 'quick-match-episodes') {
      // TODO: Implement quick match
    } else if (action === 'batch-mark-as-finished') {
      // TODO: Implement batch mark
    }
  }, [])

  const headerActions = useMemo(() => {
    if (isSelectionMode) {
      return (
        <div className="flex items-center gap-2">
          <Btn color="bg-error" size="small" disabled={_isPending}>
            {t('MessageRemoveEpisodes', { 0: selectedEpisodes.size })}
          </Btn>
          <Btn size="small" onClick={handleClearSelection} disabled={_isPending}>
            {t('ButtonCancel')}
          </Btn>
        </div>
      )
    }

    return <HeaderActionButton onClick={onFindEpisodes}>{t('LabelFindEpisodes')}</HeaderActionButton>
  }, [isSelectionMode, selectedEpisodes.size, _isPending, t, handleClearSelection, onFindEpisodes])

  if (episodes.length === 0) {
    return null
  }

  return (
    <AccordionSection
      title={t('HeaderEpisodes')}
      count={filteredEpisodes.length === episodes.length ? episodes.length : undefined}
      badge={filteredEpisodes.length !== episodes.length ? `${filteredEpisodes.length} / ${episodes.length}` : undefined}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
      className={mergeClasses(className)}
    >
      <div className="w-full">
        {/* Toolbar: Filter, Sort, Actions */}
        {!isSelectionMode && (
          <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-bg-elevated">
            <TextInput
              size="small"
              value={search}
              onChange={(val) => setSearch(val)}
              type="search"
              placeholder={t('PlaceholderSearchEpisode')}
              className="w-full md:w-auto md:grow"
            />

            <EpisodesFilterSelect value={filterKey} onChange={setFilterKey} className="w-32" />
            <EpisodesSortSelect
              sortBy={sortKey}
              sortDesc={sortDesc}
              onChange={(key, desc) => {
                setSortKey(key)
                setSortDesc(desc)
              }}
              className="w-38"
            />

            <ContextMenuDropdown size="small" items={contextMenuItems} onAction={({ action }) => handleContextMenuAction(action)} autoWidth />
          </div>
        )}

        {/* Episodes list */}
        <div className="relative min-h-20">
          {isSearching ? (
            <div className="w-full h-44 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          ) : filteredEpisodes.length === 0 ? (
            <div className="h-44 flex items-center justify-center">
              <p className="text-lg">{t('MessageNoEpisodes')}</p>
            </div>
          ) : (
            filteredEpisodes.map((episode) => (
              <EpisodeRow
                key={episode.id}
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
                onToggleFinished={handleToggleFinished}
                onSelect={handleSelectEpisode}
                onEdit={handleEditEpisode}
                onRemove={handleRemoveEpisode}
                onDownload={onDownloadEpisode}
                isStreamingThisEpisode={isStreaming(libraryItem.id, episode.id)}
                isDownloading={episodesDownloading.some((e) => e.episodeId === episode.id)}
                isQueued={episodeDownloadsQueued.some((e) => e.episodeId === episode.id)}
              />
            ))
          )}
        </div>
      </div>
    </AccordionSection>
  )
}
