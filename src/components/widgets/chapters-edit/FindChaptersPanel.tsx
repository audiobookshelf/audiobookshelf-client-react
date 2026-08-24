'use client'

import { searchChaptersAction } from '@/app/actions/chapterActions'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { blurActiveChapterEditorField } from '@/lib/chapterEditorFocus'
import {
  AUDIBLE_REGIONS,
  type AudibleRegion,
  getAudibleChapterLookupErrorMessage,
  getInitialAsinFromMetadata,
  getStoredAudibleRegion,
  setStoredAudibleRegion
} from '@/lib/chapters/audibleChapterLookupPrefs'
import type { AudibleChapterSearchResult, BookMetadata } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface FindChaptersPanelProps {
  metadata: BookMetadata
  onResult: (data: AudibleChapterSearchResult) => void
}

export default function FindChaptersPanel({ metadata, onResult }: FindChaptersPanelProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()

  const [asinInput, setAsinInput] = useState(() => getInitialAsinFromMetadata(metadata))
  const [regionInput, setRegionInput] = useState<AudibleRegion>(() => getStoredAudibleRegion())

  useEffect(() => {
    setRegionInput(getStoredAudibleRegion())
    setAsinInput(getInitialAsinFromMetadata(metadata))
  }, [metadata.asin, metadata])

  const regionItems = useMemo(() => AUDIBLE_REGIONS.map((r) => ({ text: r, value: r })), [])

  const runSearch = useCallback(
    (asin: string, region: AudibleRegion) => {
      const trimmedAsin = asin.trim()
      if (!trimmedAsin) {
        showToast(t('ToastAsinRequired'), { type: 'error' })
        return
      }

      setStoredAudibleRegion(region)

      startTransition(async () => {
        try {
          const data = await searchChaptersAction(trimmedAsin, region)
          const errorMessage = getAudibleChapterLookupErrorMessage(data, t)
          if (errorMessage) {
            showToast(t('MessageAsinCheck'), { type: 'error', title: errorMessage })
          } else {
            onResult(data)
          }
        } catch (error) {
          console.error('Failed to get chapter data', error)
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
        }
      })
    },
    [onResult, showToast, t]
  )

  const handleSearch = useCallback(() => {
    blurActiveChapterEditorField()
    runSearch(asinInput, regionInput)
  }, [asinInput, regionInput, runSearch])

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (isPending) return
        handleSearch()
      }}
    >
      <TextInput
        value={asinInput}
        label="ASIN" // i18n-ignore
        size="small"
        className="w-26"
        onChange={setAsinInput}
      />
      <Dropdown
        label={t('LabelRegion')}
        value={regionInput}
        items={regionItems}
        size="small"
        className="w-24 min-w-24 shrink-0"
        onChange={(v) => setRegionInput(String(v))}
      />
      <Btn type="submit" color="bg-primary" size="small" loading={isPending}>
        {t('ButtonSearch')}
      </Btn>
    </form>
  )
}
