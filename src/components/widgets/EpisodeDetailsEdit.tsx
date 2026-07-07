'use client'

import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import SlateEditor from '@/components/ui/SlateEditor'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import type { PodcastEpisode, UpdatePodcastEpisodePayload } from '@/types/api'
import { useCallback, useEffect, useImperativeHandle, useMemo, useReducer, useRef, useState } from 'react'

type EpisodeDetails = {
  season: string
  episode: string
  episodeType: string
  title: string
  subtitle: string
  description: string
  pubDate: string | null
  publishedAt: number | null
}

export type EpisodeBatchDetails = Pick<EpisodeDetails, 'season' | 'episode' | 'episodeType' | 'subtitle'>

function episodeToDetails(episode: PodcastEpisode): EpisodeDetails {
  return {
    season: episode.season || '',
    episode: episode.episode || '',
    episodeType: episode.episodeType || '',
    title: episode.title || '',
    subtitle: episode.subtitle || '',
    description: episode.description || '',
    pubDate: episode.pubDate || null,
    publishedAt: episode.publishedAt ?? null
  }
}

function pubDateToDatetimeLocal(pubDate: string | null | undefined): string {
  if (!pubDate) return ''
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return ''
  return formatJsDate(date, "yyyy-MM-dd'T'HH:mm")
}

function datetimeLocalToPubDate(value: string): { pubDate: string | null; publishedAt: number | null } {
  if (!value) {
    return { pubDate: null, publishedAt: null }
  }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return { pubDate: null, publishedAt: null }
  }
  return {
    pubDate: formatJsDate(date, 'E, d MMM yyyy HH:mm:ssxx'),
    publishedAt: date.valueOf()
  }
}

export type EpisodeDetailsEditRef = {
  submit: () => boolean
  mapBatchDetails: (batchDetails: Partial<EpisodeBatchDetails>) => void
}

export type EpisodeDetailsEditSubmitResult = {
  updatePayload: UpdatePodcastEpisodePayload
  hasChanges: boolean
  invalidPubDate: boolean
}

interface EpisodeDetailsEditProps {
  episode: PodcastEpisode
  onChange?: (details: { episodeId: string; hasChanges: boolean }) => void
  onSubmit?: (result: EpisodeDetailsEditSubmitResult) => void
  ref?: React.Ref<EpisodeDetailsEditRef>
}

export default function EpisodeDetailsEdit({ episode, onChange, onSubmit, ref }: EpisodeDetailsEditProps) {
  const t = useTypeSafeTranslations()
  const pubDateInputRef = useRef<HTMLInputElement>(null)
  const [pubDateInvalid, setPubDateInvalid] = useState(false)

  const initial = useMemo(() => episodeToDetails(episode), [episode])

  const [details, setDetails] = useReducer((state: EpisodeDetails, action: Partial<EpisodeDetails> | 'reset') => {
    if (action === 'reset') return initial
    return { ...state, ...action }
  }, initial)

  const [pubDateInput, setPubDateInput] = useState(() => pubDateToDatetimeLocal(episode.pubDate))

  useEffect(() => {
    setDetails('reset')
    setPubDateInput(pubDateToDatetimeLocal(episode.pubDate))
    setPubDateInvalid(false)
  }, [episode.id, initial, episode.pubDate])

  const updateField = useCallback(<K extends keyof EpisodeDetails>(field: K, value: EpisodeDetails[K]) => {
    setDetails({ [field]: value })
  }, [])

  const mapBatchDetails = useCallback((batchDetails: Partial<EpisodeBatchDetails>) => {
    const patch: Partial<EpisodeDetails> = {}
    for (const key of Object.keys(batchDetails) as (keyof EpisodeBatchDetails)[]) {
      const value = batchDetails[key]
      if (value !== undefined) {
        patch[key] = value
      }
    }
    if (Object.keys(patch).length > 0) {
      setDetails(patch)
    }
  }, [])

  const handlePubDateChange = useCallback((value: string) => {
    setPubDateInput(value)
    setPubDateInvalid(false)
    const { pubDate, publishedAt } = datetimeLocalToPubDate(value)
    setDetails({ pubDate, publishedAt })
  }, [])

  const getUpdatePayload = useCallback((): UpdatePodcastEpisodePayload => {
    const payload: UpdatePodcastEpisodePayload = {}
    const keys: (keyof EpisodeDetails)[] = ['season', 'episode', 'episodeType', 'title', 'subtitle', 'description', 'pubDate', 'publishedAt']
    for (const key of keys) {
      if (details[key] != initial[key]) {
        const value = details[key]
        if (value !== null && value !== undefined) {
          ;(payload as Record<string, unknown>)[key] = value
        }
      }
    }
    return payload
  }, [details, initial])

  const hasChanges = useMemo(() => Object.keys(getUpdatePayload()).length > 0, [getUpdatePayload])

  useEffect(() => {
    onChange?.({ episodeId: episode.id, hasChanges })
  }, [episode.id, hasChanges, onChange])

  const submitForm = useCallback(() => {
    const input = pubDateInputRef.current
    const invalidPubDate = Boolean(pubDateInput && input?.validity?.badInput)
    if (invalidPubDate) {
      setPubDateInvalid(true)
      onSubmit?.({ updatePayload: {}, hasChanges: false, invalidPubDate: true })
      return false
    }

    const updatePayload = getUpdatePayload()
    const result: EpisodeDetailsEditSubmitResult = {
      updatePayload,
      hasChanges: Object.keys(updatePayload).length > 0,
      invalidPubDate: false
    }
    onSubmit?.(result)
    return true
  }, [getUpdatePayload, onSubmit, pubDateInput])

  useImperativeHandle(ref, () => ({ submit: submitForm, mapBatchDetails }), [submitForm, mapBatchDetails])

  const episodeTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelFull'), value: 'full' },
      { text: t('LabelTrailer'), value: 'trailer' },
      { text: t('LabelBonus'), value: 'bonus' }
    ],
    [t]
  )

  const enclosureUrl = episode.enclosure?.url

  return (
    <form
      className="w-full px-2 pt-4 pb-2 md:px-4"
      onSubmit={(e) => {
        e.preventDefault()
        submitForm()
      }}
    >
      <div className="-mx-1 flex flex-wrap">
        <div className="w-1/2 p-1 md:w-1/5">
          <TextInput value={details.season} onChange={(v) => updateField('season', v)} label={t('LabelSeason')} />
        </div>
        <div className="w-1/2 p-1 md:w-1/5">
          <TextInput value={details.episode} onChange={(v) => updateField('episode', v)} label={t('LabelEpisode')} />
        </div>
        <div className="mt-2 w-28 p-1 md:mt-0 md:w-1/5">
          <Dropdown
            label={t('LabelEpisodeType')}
            value={details.episodeType || 'full'}
            items={episodeTypeItems}
            onChange={(value) => updateField('episodeType', String(value))}
          />
        </div>
        <div className="mt-2 min-w-0 flex-1 p-1 md:mt-0 md:w-2/5 md:flex-none">
          <TextInput
            ref={pubDateInputRef}
            type="datetime-local"
            value={pubDateInput}
            onChange={handlePubDateChange}
            label={t('LabelPubDate')}
            error={pubDateInvalid || undefined}
          />
        </div>
        <div className="mt-2 w-full p-1">
          <TextInput value={details.title} onChange={(v) => updateField('title', v)} label={t('LabelTitle')} />
        </div>
        <div className="mt-2 w-full p-1">
          <TextareaInput value={details.subtitle} onChange={(v) => updateField('subtitle', v)} label={t('LabelSubtitle')} rows={3} />
        </div>
        <div className="mt-2 w-full p-1">
          <SlateEditor srcContent={initial.description || ''} onUpdate={(v) => updateField('description', v)} label={t('LabelDescription')} />
        </div>
      </div>

      {enclosureUrl ? (
        <div className="p-1 pt-4">
          <TextInput value={enclosureUrl} readOnly label={t('LabelEpisodeUrlFromRssFeed')} className="text-xs" />
        </div>
      ) : (
        <p className="text-foreground-muted p-1 pt-4 text-xs font-semibold">{t('LabelEpisodeNotLinkedToRssFeed')}</p>
      )}
    </form>
  )
}
