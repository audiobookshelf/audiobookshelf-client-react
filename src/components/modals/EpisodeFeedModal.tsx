import { downloadPodcastEpisodesAction } from '@/app/actions/mediaActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatDuration } from '@/lib/formatDuration'
import { bytesPretty } from '@/lib/string'
import { PodcastEpisodeDownload, PodcastLibraryItem, RssPodcastEpisode } from '@/types/api'
import { useFormatter } from 'next-intl'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

export interface EpisodeFeedModalProps {
  isOpen: boolean
  onClose: () => void
  libraryItem: PodcastLibraryItem
  episodes: RssPodcastEpisode[]
  downloadQueue: PodcastEpisodeDownload[]
  episodesDownloading: PodcastEpisodeDownload[]
}

const getCleanEpisodeUrl = (url: string) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (key !== 'id') parsed.searchParams.delete(key)
    }
    return parsed.toString()
  } catch {
    // Fallback for malformed URLs
    const splitUrl = url.split('?')
    if (!splitUrl[1]) return url
    const searchParams = new URLSearchParams(splitUrl[1])
    for (const p of Array.from(searchParams.keys())) {
      if (p !== 'id') searchParams.delete(p)
    }
    if (!searchParams.toString()) return splitUrl[0]
    return `${splitUrl[0]}?${searchParams.toString()}`
  }
}

export default function EpisodeFeedModal({ isOpen, onClose, libraryItem, episodes, downloadQueue, episodesDownloading }: EpisodeFeedModalProps) {
  const t = useTypeSafeTranslations()
  const format = useFormatter()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState('')
  const [sortDescending, setSortDescending] = useState(true)
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const itemEpisodes = useMemo(() => libraryItem.media.episodes || [], [libraryItem.media.episodes])

  const { downloadedEpisodeGuidMap, downloadedEpisodeUrlMap } = useMemo(() => {
    const guidMap: Record<string, string> = {}
    const urlMap: Record<string, string> = {}

    itemEpisodes.forEach((episode) => {
      // Prefer guid match; fall back to URL (from enclosure or audioFile path)
      if (episode.guid) guidMap[episode.guid] = episode.id
      if (episode.enclosure?.url) urlMap[getCleanEpisodeUrl(episode.enclosure.url)] = episode.id
      if (episode.audioFile?.metadata?.path) urlMap[getCleanEpisodeUrl(episode.audioFile.metadata.path)] = episode.id
    })
    return { downloadedEpisodeGuidMap: guidMap, downloadedEpisodeUrlMap: urlMap }
  }, [itemEpisodes])

  const getIsEpisodeDownloaded = useCallback(
    (episode: RssPodcastEpisode & { cleanUrl: string }) => {
      if (episode.guid && !!downloadedEpisodeGuidMap[episode.guid]) {
        return true
      }
      return !!downloadedEpisodeUrlMap[episode.cleanUrl]
    },
    [downloadedEpisodeGuidMap, downloadedEpisodeUrlMap]
  )

  // Merged once per render so getIsEpisodeDownloadingOrQueued doesn't allocate on every call
  const episodesToCheck = useMemo(() => [...episodesDownloading, ...downloadQueue], [episodesDownloading, downloadQueue])

  const getIsEpisodeDownloadingOrQueued = useCallback(
    (episode: RssPodcastEpisode & { cleanUrl: string }) => {
      if (episode.guid) {
        return episodesToCheck.some((download) => download.guid === episode.guid)
      }
      return episodesToCheck.some((download) => download.url && getCleanEpisodeUrl(download.url) === episode.cleanUrl)
    },
    [episodesToCheck]
  )

  const episodesCleaned = useMemo(() => {
    return episodes
      .filter((ep) => ep.enclosure.url)
      .map((ep) => {
        const cleanUrl = getCleanEpisodeUrl(ep.enclosure.url)
        const extendedEp = { ...ep, cleanUrl }
        return {
          ...extendedEp,
          isDownloading: getIsEpisodeDownloadingOrQueued(extendedEp),
          isDownloaded: getIsEpisodeDownloaded(extendedEp)
        }
      })
      .sort((a, b) => {
        const publishedAtA = a.publishedAt || 0
        const publishedAtB = b.publishedAt || 0
        if (sortDescending) {
          return publishedAtA < publishedAtB ? 1 : -1
        }
        return publishedAtA > publishedAtB ? 1 : -1
      })
  }, [episodes, sortDescending, getIsEpisodeDownloadingOrQueued, getIsEpisodeDownloaded])

  const episodesList = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return episodesCleaned
    return episodesCleaned.filter((episode) => {
      return episode.title?.toLowerCase().includes(s) || episode.subtitle?.toLowerCase().includes(s)
    })
  }, [episodesCleaned, search])

  const allDownloaded = useMemo(() => {
    if (episodesCleaned.length === 0) return false
    return !episodesCleaned.some((episode) => !episode.isDownloaded)
  }, [episodesCleaned])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setSortDescending(true)
      setSelectedEpisodes(new Set())
      setSelectAll(false)
    }
  }, [isOpen])

  // Sync selectAll checkbox with current selection state
  useEffect(() => {
    if (episodesList.length === 0) {
      setSelectAll(false)
      return
    }
    let allSelected = true
    for (const episode of episodesList) {
      if (!episode.isDownloaded && !episode.isDownloading && !selectedEpisodes.has(episode.cleanUrl)) {
        allSelected = false
        break
      }
    }
    setSelectAll(allSelected)
  }, [episodesList, selectedEpisodes])

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectAll(checked)
      setSelectedEpisodes((prev) => {
        const next = new Set(prev)
        for (const episode of episodesList) {
          if (!episode.isDownloaded && !episode.isDownloading) {
            if (checked) {
              next.add(episode.cleanUrl)
            } else {
              next.delete(episode.cleanUrl)
            }
          }
        }
        return next
      })
    },
    [episodesList]
  )

  const toggleSelectEpisode = useCallback((episode: RssPodcastEpisode & { cleanUrl: string; isDownloaded: boolean; isDownloading: boolean }) => {
    if (episode.isDownloaded || episode.isDownloading) return

    setSelectedEpisodes((prev) => {
      const next = new Set(prev)
      if (next.has(episode.cleanUrl)) {
        next.delete(episode.cleanUrl)
      } else {
        next.add(episode.cleanUrl)
      }
      return next
    })
  }, [])

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()

      if (selectedEpisodes.size === 0) return

      const episodesToDownload = episodesCleaned.filter((ep) => selectedEpisodes.has(ep.cleanUrl))
      // Use TextEncoder for accurate byte count (handles non-ASCII characters)
      const payloadBytes = new TextEncoder().encode(JSON.stringify(episodesToDownload)).length
      const sizeInMb = payloadBytes / 1024 / 1024

      if (sizeInMb > 9.99) {
        showToast(t('ToastRequestTooLarge', { 0: sizeInMb.toFixed(2) }), { type: 'error' })
        return
      }

      startTransition(async () => {
        try {
          await downloadPodcastEpisodesAction(libraryItem.id, episodesToDownload)
          showToast(t('ToastStartedDownloadingEpisodes'), { type: 'success' })
          onClose()
        } catch (error: Error | unknown) {
          console.error('Failed to download episodes', error)
          const errorMessage = error instanceof Error ? error.message : ''
          showToast(errorMessage || t('ToastFailedToDownloadEpisodes'), { type: 'error' })
          setSelectedEpisodes(new Set())
          setSelectAll(false)
        }
      })
    },
    [selectedEpisodes, episodesCleaned, libraryItem.id, showToast, onClose, t]
  )

  const selectAllLabel = useMemo(() => {
    if (episodesList.length === episodesCleaned.length) {
      return t('LabelSelectAllEpisodes')
    }
    const episodesNotDownloaded = episodesList.filter((ep) => !ep.isDownloaded).length
    return t('LabelSelectEpisodesShowing', { 0: episodesNotDownloaded })
  }, [episodesList, episodesCleaned, t])

  const buttonText = useMemo(() => {
    if (selectedEpisodes.size === 0) return t('LabelNoEpisodesSelected')
    return t('LabelDownloadNEpisodes', { count: selectedEpisodes.size })
  }, [selectedEpisodes.size, t])

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      outerContent={
        <div className="pointer-events-none absolute top-0 left-0 w-2/3 overflow-hidden p-5">
          <p className="truncate text-3xl text-white drop-shadow-md">{libraryItem.media.metadata.title}</p>
        </div>
      }
      style={{ maxWidth: 1200 }}
    >
      <div className="flex h-[80vh] min-h-[400px] flex-col px-4 sm:px-6">
        {episodesCleaned.length > 0 && (
          <div className="flex w-full shrink-0 gap-2 py-4">
            <form onSubmit={handleSubmit} className="flex grow">
              <TextInput
                value={search}
                onChange={setSearch}
                type="search"
                placeholder={t('PlaceholderSearchEpisode')}
                className="mr-2 grow text-sm md:text-base"
              />
            </form>
            <Btn className="px-4" onClick={() => setSortDescending(!sortDescending)}>
              <span className="pr-4">{t('LabelSortPubDate')}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-yellow-400">
                <span className="material-symbols text-xl" aria-label={sortDescending ? t('LabelSortDescending') : t('LabelSortAscending')}>
                  {sortDescending ? 'expand_more' : 'expand_less'}
                </span>
              </span>
            </Btn>
          </div>
        )}

        <div className="w-full grow overflow-x-hidden overflow-y-auto">
          {episodesList.map((episode) => {
            const isSelected = selectedEpisodes.has(episode.cleanUrl)
            let bgClass = 'even:bg-table-row-bg-even hover:bg-table-row-bg-hover'
            let textClass = 'text-foreground'
            let subTextClass = 'text-foreground-muted'

            if (episode.isDownloaded || episode.isDownloading) {
              bgClass = 'bg-primary/40'
              textClass = 'text-disabled'
              subTextClass = 'text-disabled/70'
            } else if (isSelected) {
              bgClass = 'bg-success/10'
            }

            const publishedString = episode.publishedAt ? format.relativeTime(new Date(episode.publishedAt), { now: new Date() }) : t('LabelUnknown')
            const publishedLabel = t('LabelPublished', { 0: publishedString })

            return (
              <div
                key={episode.guid || episode.cleanUrl}
                className={`border-border relative flex cursor-pointer items-center border-b last:border-0 ${bgClass}`}
                onClick={() => toggleSelectEpisode(episode)}
              >
                <div className="flex w-12 flex-none items-center justify-center p-3 sm:w-16">
                  {episode.isDownloaded ? (
                    <span className="material-symbols text-success text-xl">download_done</span>
                  ) : episode.isDownloading ? (
                    <span className="material-symbols text-warning text-xl">download</span>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelectEpisode(episode)
                      }}
                      className="flex items-center justify-center"
                    >
                      <Checkbox value={isSelected} size="small" />
                    </div>
                  )}
                </div>
                <div className="flex-grow py-2 pr-4 sm:pr-8">
                  <div className={`flex items-center gap-1 font-semibold ${textClass}`}>
                    {(episode.season || episode.episode) && <div>#</div>}
                    {episode.season && <div>{episode.season}x</div>}
                    {episode.episode && <div>{episode.episode}</div>}
                  </div>
                  <div className={`mb-1 flex items-center gap-2 ${textClass}`}>
                    <div className="break-words">{episode.title}</div>
                    {episode.episodeType &&
                      (episode.episodeType.toLowerCase() === 'trailer' || episode.episodeType.toLowerCase() === 'bonus' ? (
                        <span className="bg-info rounded-full px-2 py-0.5 text-xs text-white capitalize">{episode.episodeType}</span>
                      ) : null)}
                  </div>
                  {episode.subtitle && <p className={`mb-1 line-clamp-2 text-sm ${subTextClass}`}>{episode.subtitle}</p>}

                  <div className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 ${subTextClass}`}>
                    <p className="w-40 text-xs">{publishedLabel}</p>
                    {episode.durationSeconds != null && episode.durationSeconds > 0 && (
                      <p className="min-w-28 text-xs">
                        {t('LabelDuration')}: {formatDuration(episode.durationSeconds, t)}
                      </p>
                    )}
                    {episode.enclosure?.length && !isNaN(Number(episode.enclosure.length)) && Number(episode.enclosure.length) > 0 && (
                      <p className="text-xs">
                        {t('LabelSize')}: {bytesPretty(Number(episode.enclosure.length))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 py-4">
          {!allDownloaded ? (
            <>
              <Checkbox value={selectAll} onChange={toggleSelectAll} label={selectAllLabel} size="small" labelClass="whitespace-nowrap" />
              <Btn className="shrink-0 whitespace-nowrap" disabled={selectedEpisodes.size === 0 || isPending} onClick={handleSubmit} size="small">
                {buttonText}
              </Btn>
            </>
          ) : (
            <p className="text-success px-2 py-4 text-base">{t('LabelAllEpisodesDownloaded')}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
