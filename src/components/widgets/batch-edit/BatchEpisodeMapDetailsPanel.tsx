'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown, { type DropdownItem } from '@/components/ui/Dropdown'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EpisodeBatchDetails } from '@/components/widgets/EpisodeDetailsEdit'
import type { PodcastEpisode } from '@/types/api'
import { useCallback, useImperativeHandle, useMemo, useState } from 'react'

type EpisodeBatchFieldKey = keyof EpisodeBatchDetails

type EpisodeBatchUsage = Record<EpisodeBatchFieldKey, boolean>

const EMPTY_USAGE: EpisodeBatchUsage = {
  season: false,
  episode: false,
  episodeType: false,
  subtitle: false
}

const EMPTY_DETAILS: EpisodeBatchDetails = {
  season: '',
  episode: '',
  episodeType: 'full',
  subtitle: ''
}

const MAP_FIELD_ROW_CLASS = 'flex min-h-18 w-full items-center gap-4 px-4 sm:w-1/2 [&>:first-child]:shrink-0'
const MAP_FIELD_TEXTAREA_ROW_CLASS = 'flex min-h-18 w-full items-center gap-4 px-4 sm:w-1/2 [&>:first-child]:shrink-0'
const MAP_FIELD_INPUT_CLASS = 'mb-5 min-w-0 flex-1'

interface BatchEpisodeMapDetailsPanelProps {
  episodes: PodcastEpisode[]
  onApply: (payload: Partial<EpisodeBatchDetails>) => void
  disabled?: boolean
  ref?: React.Ref<BatchEpisodeMapDetailsPanelRef>
}

export type BatchEpisodeMapDetailsPanelRef = {
  populateFromExisting: (episodeId?: string) => void
  hasSelectedUsage: () => boolean
}

export default function BatchEpisodeMapDetailsPanel({ episodes, onApply, disabled = false, ref }: BatchEpisodeMapDetailsPanelProps) {
  const t = useTypeSafeTranslations()
  const [open, setOpen] = useState(true)
  const [usage, setUsage] = useState<EpisodeBatchUsage>({ ...EMPTY_USAGE })
  const [details, setDetails] = useState<EpisodeBatchDetails>({ ...EMPTY_DETAILS })

  const hasSelectedUsage = useMemo(() => Object.values(usage).some(Boolean), [usage])

  const setUsageField = useCallback((field: EpisodeBatchFieldKey, value: boolean) => {
    setUsage((prev) => ({ ...prev, [field]: value }))
  }, [])

  const resetMapDetails = useCallback(() => {
    setUsage({ ...EMPTY_USAGE })
    setDetails({ ...EMPTY_DETAILS })
  }, [])

  const populateFromExisting = useCallback(
    (episodeId?: string) => {
      const itemsToMap = episodeId ? episodes.filter((ep) => ep.id === episodeId) : episodes

      setDetails((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(usage) as EpisodeBatchFieldKey[]) {
          if (!usage[key]) continue
          const first = itemsToMap[0]
          if (!first) continue
          if (key === 'episodeType') {
            next.episodeType = first.episodeType || 'full'
          } else {
            next[key] = (first[key] as string) || ''
          }
        }
        return next
      })
    },
    [episodes, usage]
  )

  const handleApply = useCallback(() => {
    const payload: Partial<EpisodeBatchDetails> = {}
    for (const key of Object.keys(usage) as EpisodeBatchFieldKey[]) {
      if (!usage[key]) continue
      payload[key] = details[key]
    }
    onApply(payload)
  }, [details, onApply, usage])

  useImperativeHandle(
    ref,
    () => ({
      populateFromExisting,
      hasSelectedUsage: () => hasSelectedUsage
    }),
    [hasSelectedUsage, populateFromExisting]
  )

  const fieldDisabled = (field: EpisodeBatchFieldKey) => disabled || !usage[field]

  const episodeTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelFull'), value: 'full' },
      { text: t('LabelTrailer'), value: 'trailer' },
      { text: t('LabelBonus'), value: 'bonus' }
    ],
    [t]
  )

  return (
    <div className="border-foreground/15 mx-auto mt-5 mb-10 max-w-7xl border">
      <button type="button" className="flex w-full cursor-pointer items-center px-4 py-4 text-start" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="material-symbols shrink-0 text-2xl">{open ? 'expand_less' : 'expand_more'}</span>
        <p className="text-foreground-muted ms-4 min-w-0 text-lg">{t('HeaderMapDetails')}</p>
      </button>

      {open && (
        <div className="flex flex-wrap">
          <div className={MAP_FIELD_ROW_CLASS}>
            <Checkbox value={usage.season} onChange={(v) => setUsageField('season', v)} disabled={disabled} />
            <TextInput
              value={details.season}
              onChange={(v) => setDetails((d) => ({ ...d, season: v }))}
              disabled={fieldDisabled('season')}
              label={t('LabelSeason')}
              className={MAP_FIELD_INPUT_CLASS}
            />
          </div>

          <div className={MAP_FIELD_ROW_CLASS}>
            <Checkbox value={usage.episode} onChange={(v) => setUsageField('episode', v)} disabled={disabled} />
            <TextInput
              value={details.episode}
              onChange={(v) => setDetails((d) => ({ ...d, episode: v }))}
              disabled={fieldDisabled('episode')}
              label={t('LabelEpisode')}
              className={MAP_FIELD_INPUT_CLASS}
            />
          </div>

          <div className={MAP_FIELD_ROW_CLASS}>
            <Checkbox value={usage.episodeType} onChange={(v) => setUsageField('episodeType', v)} disabled={disabled} />
            <div className={MAP_FIELD_INPUT_CLASS}>
              <Dropdown
                label={t('LabelEpisodeType')}
                value={details.episodeType || 'full'}
                items={episodeTypeItems}
                disabled={fieldDisabled('episodeType')}
                onChange={(value) => setDetails((d) => ({ ...d, episodeType: String(value) }))}
              />
            </div>
          </div>

          <div className={MAP_FIELD_TEXTAREA_ROW_CLASS}>
            <Checkbox value={usage.subtitle} onChange={(v) => setUsageField('subtitle', v)} disabled={disabled} />
            <TextareaInput
              value={details.subtitle}
              onChange={(v) => setDetails((d) => ({ ...d, subtitle: v }))}
              disabled={fieldDisabled('subtitle')}
              label={t('LabelSubtitle')}
              rows={2}
              className={MAP_FIELD_INPUT_CLASS}
            />
          </div>

          <div className="flex w-full flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-2">
            <Btn size="small" className="w-full sm:w-auto" onClick={resetMapDetails} disabled={disabled}>
              {t('ButtonReset')}
            </Btn>
            <Tooltip text={t('MessageBatchEditPopulateMapDetailsAllHelp')} position="bottom" className="w-full sm:w-auto">
              <Btn size="small" className="w-full sm:w-auto" disabled={disabled || !hasSelectedUsage} onClick={() => populateFromExisting()}>
                {t('ButtonBatchEditPopulateFromExisting')}
              </Btn>
            </Tooltip>
            <div className="hidden grow sm:block" />
            <Btn color="bg-success" size="small" disabled={disabled || !hasSelectedUsage} className="w-full px-8 text-base sm:w-auto" onClick={handleApply}>
              {t('ButtonApply')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
