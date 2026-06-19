'use client'

import { searchPodcastEpisodeAction, updatePodcastEpisodeAction } from '@/app/actions/mediaActions'
import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import Alert from '@/components/widgets/Alert'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { PodcastEpisode, PodcastLibraryItem, SearchPodcastEpisodeResult, UpdatePodcastEpisodePayload } from '@/types/api'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState, useTransition } from 'react'

function getMatchUpdatePayload(episode: PodcastEpisode, matchData: SearchPodcastEpisodeResult): UpdatePodcastEpisodePayload {
  const candidate = {
    title: matchData.title || '',
    subtitle: matchData.subtitle || '',
    description: matchData.description || '',
    episode: matchData.episode || '',
    episodeType: matchData.episodeType || '',
    season: matchData.season || '',
    pubDate: matchData.pubDate || '',
    publishedAt: matchData.publishedAt ?? undefined
  }

  const payload: UpdatePodcastEpisodePayload = {}
  for (const key of Object.keys(candidate) as (keyof typeof candidate)[]) {
    const value = candidate[key]
    const current = episode[key as keyof PodcastEpisode]
    if (value != current) {
      ;(payload as Record<string, unknown>)[key] = value
    }
  }

  const matchEnclosure = matchData.enclosure ?? null
  const currentEnclosure = episode.enclosure ?? null
  if (JSON.stringify(matchEnclosure) !== JSON.stringify(currentEnclosure)) {
    payload.enclosure = matchEnclosure
  }

  return payload
}

interface EpisodeMatchProps {
  libraryItem: PodcastLibraryItem
  episode: PodcastEpisode
  onEpisodeUpdated?: (episode: PodcastEpisode, libraryItem: PodcastLibraryItem) => void
}

export default function EpisodeMatch({ libraryItem, episode, onEpisodeUpdated }: EpisodeMatchProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [episodeTitle, setEpisodeTitle] = useState(episode.title || '')
  const [searchedTitle, setSearchedTitle] = useState<string | null>(null)
  const [episodesFound, setEpisodesFound] = useState<SearchPodcastEpisodeResult[]>([])
  const [isSearchPending, startSearchTransition] = useTransition()
  const [isApplyPending, startApplyTransition] = useTransition()

  const podcastFeedUrl = libraryItem.media.metadata.feedUrl
  const isProcessing = isSearchPending || isApplyPending

  useEffect(() => {
    setEpisodeTitle(episode.title || '')
    setSearchedTitle(null)
    setEpisodesFound([])
  }, [episode.id, episode.title])

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!episodeTitle.trim()) {
        showToast(t('ToastTitleRequired'), { type: 'error' })
        return
      }

      setSearchedTitle(episodeTitle)
      startSearchTransition(async () => {
        try {
          const results = await searchPodcastEpisodeAction(libraryItem.id, episodeTitle)
          setEpisodesFound(results.episodes)
        } catch (error) {
          console.error('Failed to search for episode', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [episodeTitle, libraryItem.id, showToast, t]
  )

  const handleSelectEpisode = useCallback(
    (matchData: SearchPodcastEpisodeResult) => {
      const updatePayload = getMatchUpdatePayload(episode, matchData)
      if (!Object.keys(updatePayload).length) {
        showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
        return
      }

      startApplyTransition(async () => {
        try {
          const updatedLibraryItem = await updatePodcastEpisodeAction(libraryItem.id, episode.id, updatePayload)
          const updatedEpisode = updatedLibraryItem.media.episodes?.find((ep) => ep.id === episode.id)
          showToast(t('ToastPodcastEpisodeUpdated'), { type: 'success' })
          if (updatedEpisode) {
            onEpisodeUpdated?.(updatedEpisode, updatedLibraryItem)
          }
        } catch (error) {
          console.error('Failed to update episode', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [episode, libraryItem.id, onEpisodeUpdated, showToast, t]
  )

  if (!podcastFeedUrl) {
    return (
      <div className="py-8">
        <Alert type="error">{t('MessagePodcastHasNoRSSFeedForMatching')}</Alert>
      </div>
    )
  }

  return (
    <div className="min-h-[200px] px-2 py-4 md:px-4">
      <form onSubmit={handleSearch} className="mb-2 flex items-end gap-1">
        <TextInput value={episodeTitle} onChange={setEpisodeTitle} disabled={isProcessing} label={t('LabelEpisodeTitle')} className="grow" />
        <Btn type="submit" className="shrink-0" loading={isSearchPending} disabled={isProcessing}>
          {t('ButtonSearch')}
        </Btn>
      </form>

      {!isProcessing && searchedTitle && episodesFound.length === 0 && <p className="py-8 text-center text-lg">{t('MessageNoEpisodeMatchesFound')}</p>}

      {episodesFound.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {episodesFound.map((result, index) => (
            <button
              key={`${result.guid ?? result.title}-${index}`}
              type="button"
              disabled={isProcessing}
              className="border-border hover:bg-bg-hover/50 focus:border-foreground w-full cursor-pointer rounded border p-3 text-start outline-none disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleSelectEpisode(result)}
            >
              {result.episode && <p className="text-foreground font-semibold">#{result.episode}</p>}
              <p className="mb-1 break-words">{result.title}</p>
              {result.subtitle && <p className="text-foreground-muted mb-1 line-clamp-2 text-sm">{result.subtitle}</p>}
              <p className="text-foreground-subdued text-xs">
                Published {result.publishedAt ? formatDistanceToNow(new Date(result.publishedAt), { addSuffix: true }) : 'Unknown'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
