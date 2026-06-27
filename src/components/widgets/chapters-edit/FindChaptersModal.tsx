'use client'

import { searchChaptersAction } from '@/app/actions/chapterActions'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import Modal from '@/components/modals/Modal'
import Alert from '@/components/widgets/Alert'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import {
  AUDIBLE_REGIONS,
  type AudibleRegion,
  getStoredAudibleRegion,
  setStoredAudibleRegion
} from '@/lib/chapters/audibleChapterLookupPrefs'
import { audibleChapterRowClass, removeBrandingFromAudibleData } from '@/lib/chapters/chapterEditorUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import type { AudibleChapterSearchResult, BookMetadata } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface FindChaptersModalProps {
  isOpen: boolean
  metadata: BookMetadata
  mediaDuration: number
  mediaDurationRounded: number
  savedChapterCount: number
  removeBranding: boolean
  onRemoveBrandingChange: (value: boolean) => void
  onClose: () => void
  onApplyTitles: (data: AudibleChapterSearchResult) => void
  onApplyChapters: (data: AudibleChapterSearchResult) => void
}

export default function FindChaptersModal({
  isOpen,
  metadata,
  mediaDuration,
  mediaDurationRounded,
  savedChapterCount,
  removeBranding,
  onRemoveBrandingChange,
  onClose,
  onApplyTitles,
  onApplyChapters
}: FindChaptersModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()

  const [asinInput, setAsinInput] = useState('')
  const [regionInput, setRegionInput] = useState<AudibleRegion>(() => getStoredAudibleRegion())
  const [chapterData, setChapterData] = useState<AudibleChapterSearchResult | null>(null)
  const [asinError, setAsinError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setRegionInput(getStoredAudibleRegion())
    setAsinInput(metadata.asin?.trim() || '')
    setChapterData(null)
    setAsinError(null)
  }, [isOpen, metadata.asin])

  const regionItems = useMemo(() => AUDIBLE_REGIONS.map((r) => ({ text: r, value: r })), [])

  const handleSearch = useCallback(() => {
    if (!asinInput.trim()) {
      showToast(t('ToastAsinRequired'), { type: 'error' })
      return
    }

    setStoredAudibleRegion(regionInput)
    setChapterData(null)
    setAsinError(null)

    startTransition(async () => {
      try {
        const data = await searchChaptersAction(asinInput.trim(), regionInput)
        if (data.error) {
          if (data.stringKey === 'MessageChaptersNotFound') {
            setAsinError(t('MessageChaptersNotFound'))
          } else if (data.stringKey === 'MessageInvalidAsin') {
            setAsinError(t('MessageInvalidAsin'))
          } else {
            setAsinError(data.error)
          }
        } else {
          setChapterData(removeBranding ? removeBrandingFromAudibleData(data) : data)
        }
      } catch (error) {
        console.error('Failed to get chapter data', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
        onClose()
      }
    })
  }, [asinInput, onClose, regionInput, removeBranding, showToast, t])

  const displayData = chapterData

  return (
    <Modal
      isOpen={isOpen}
      processing={isPending}
      onClose={onClose}
      style={{ width: 500 }}
      outerContent={
        <div className="absolute start-0 top-0 p-4">
          <p className="max-w-[calc(100vw-4rem)] truncate text-xl text-white">{t('HeaderFindChapters')}</p>
        </div>
      }
    >
      <div className="bg-bg border-black-300 relative max-h-full w-full rounded-lg border text-sm shadow-lg">
        {!displayData ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="relative">
              <div className="flex items-end gap-2">
                <TextInput value={asinInput} label="ASIN" className="grow" onChange={setAsinInput} />
                <Dropdown label={t('LabelRegion')} value={regionInput} items={regionItems} size="small" className="w-24 min-w-24 shrink-0" onChange={(v) => setRegionInput(String(v) as AudibleRegion)} />
                <Btn color="bg-primary" onClick={handleSearch}>
                  {t('ButtonSearch')}
                </Btn>
              </div>
              <div className="mt-4">
                <Checkbox value={removeBranding} label={t('LabelRemoveAudibleBranding')} size="small" onChange={onRemoveBrandingChange} />
              </div>
              {asinError && (
                <div className="absolute start-0 mt-1.5 h-5 text-sm text-error">
                  <p>{asinError}</p>
                  <p>{t('MessageAsinCheck')}</p>
                </div>
              )}
              <div className="invisible mt-1 text-xs" />
            </div>
          </div>
        ) : (
          <div className="w-full p-4">
            <div className="mb-4 flex">
              <IconBtn ariaLabel={t('ButtonBack')} borderless size="small" onClick={() => setChapterData(null)}>
                arrow_back
              </IconBtn>
              <p>
                {t('LabelDurationFound')}{' '}
                <span className="font-semibold">{secondsToTimestamp(displayData.runtimeLengthSec)}</span>
                <br />
                <span className={savedChapterCount !== displayData.chapters.length ? 'font-semibold text-warning' : 'font-semibold'}>
                  {displayData.chapters.length}
                </span>{' '}
                {t('LabelChaptersFound')}
              </p>
              <div className="grow" />
              <p>
                {t('LabelYourAudiobookDuration')}: <span className="font-semibold">{secondsToTimestamp(mediaDurationRounded)}</span>
                <br />
                Your audiobook has{' '}
                <span className={savedChapterCount !== displayData.chapters.length ? 'font-semibold text-warning' : 'font-semibold'}>
                  {savedChapterCount}
                </span>{' '}
                chapters
              </p>
            </div>

            {displayData.runtimeLengthSec > mediaDurationRounded && (
              <Alert type="warning" className="mb-2">
                {t('MessageYourAudiobookDurationIsShorter')}
              </Alert>
            )}
            {displayData.runtimeLengthSec < mediaDurationRounded && (
              <Alert type="warning" className="mb-2">
                {t('MessageYourAudiobookDurationIsLonger')}
              </Alert>
            )}

            <div className="mb-1 flex py-0.5 text-xs font-semibold uppercase text-gray-300">
              <div className="w-24 px-2">{t('LabelStart')}</div>
              <div className="grow px-2">{t('LabelTitle')}</div>
            </div>
            <div className="my-2 max-h-80 w-full overflow-y-auto">
              {displayData.chapters.map((chapter, index) => (
                <div key={index} className={`flex py-0.5 text-xs ${audibleChapterRowClass(chapter, index, mediaDuration)}`}>
                  <div className="w-24 min-w-24 px-2">
                    <p className="font-mono">{secondsToTimestamp(chapter.startOffsetSec)}</p>
                  </div>
                  <div className="grow px-2">
                    <p className="max-w-sm truncate">{chapter.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {displayData.runtimeLengthSec > mediaDurationRounded && (
              <div className="w-full pt-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-warning/50" />
                  <p className="ps-2">{t('MessageChapterEndIsAfter')}</p>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-error/50" />
                  <p className="ps-2">{t('MessageChapterStartIsAfter')}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Btn
                  size="small"
                  color="bg-primary"
                  onClick={() => {
                    onApplyTitles(displayData)
                  }}
                >
                  {t('ButtonMapChapterTitles')}
                </Btn>
                <Tooltip text={t('MessageMapChapterTitles')} position="top" className="flex items-center">
                  <span className="material-symbols text-xl text-gray-200">info</span>
                </Tooltip>
              </div>
              <Btn
                size="small"
                color="bg-success"
                onClick={() => {
                  onApplyChapters(displayData)
                }}
              >
                {t('ButtonApplyChapters')}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
