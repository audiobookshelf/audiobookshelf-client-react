'use client'

import { deleteMediaProgressAction } from '@/app/actions/mediaActions'
import ButtonBase from '@/components/ui/ButtonBase'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { formatJsDate } from '@/lib/datefns'
import { formatDuration } from '@/lib/formatDuration'
import { computeProgress } from '@/lib/mediaProgress'
import type { BookLibraryItem, MediaProgress } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'

interface LibraryItemProgressPanelProps {
  libraryItem: BookLibraryItem
  mediaProgress: MediaProgress
  dateFormat: string
}

export default function LibraryItemProgressPanel({ libraryItem, mediaProgress, dateFormat }: LibraryItemProgressPanelProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { percent, startedAt, finishedAt } = useMemo(() => computeProgress({ progress: mediaProgress, useSeriesProgress: false }), [mediaProgress])

  const useEbookProgress = !mediaProgress.progress && mediaProgress.ebookProgress > 0

  const timeRemainingLabel = useMemo(() => {
    if (percent >= 1 || useEbookProgress) return null
    const duration = mediaProgress.duration || libraryItem.media.duration || 0
    const remaining = Math.max(0, duration - mediaProgress.currentTime)
    return t('LabelTimeRemaining', { 0: formatDuration(remaining, t) })
  }, [percent, useEbookProgress, mediaProgress.duration, mediaProgress.currentTime, libraryItem.media.duration, t])

  const handleConfirmReset = useCallback(async () => {
    setIsConfirmOpen(false)
    try {
      await deleteMediaProgressAction(mediaProgress.id)
    } catch (error) {
      console.error('Progress reset failed', error)
      showToast(t('ToastFailedToUpdate'), { type: 'error' })
    }
  }, [mediaProgress.id, showToast, t])

  if (percent <= 0) {
    return null
  }

  return (
    <>
      <div
        role="region"
        aria-label={t('LabelYourProgress')}
        className="bg-primary border-border text-foreground relative mt-4 max-w-max rounded-md border px-4 py-2 text-sm font-semibold"
      >
        {percent < 1 ? (
          <p className="leading-6">{t('LabelYourProgressWithPercent', { 0: Math.round(percent * 100) })}</p>
        ) : (
          <p className="text-xs">{t('LabelFinishedDate', { 0: finishedAt ? formatJsDate(new Date(finishedAt), dateFormat) : '' })}</p>
        )}
        {timeRemainingLabel ? <p className="text-foreground-muted text-xs">{timeRemainingLabel}</p> : null}
        {startedAt ? (
          <p className="text-foreground-subdued pt-1 text-xs">{t('LabelStartedDate', { 0: formatJsDate(new Date(startedAt), dateFormat) })}</p>
        ) : null}

        <ButtonBase
          borderless
          size="custom"
          ariaLabel={t('ButtonResetProgress')}
          className="group absolute top-1 right-1 z-10 size-9 shrink-0 translate-x-1/2 -translate-y-1/2"
          onClick={() => setIsConfirmOpen(true)}
        >
          <span className="bg-bg border-primary group-hover:bg-error flex size-5 items-center justify-center rounded-full border p-1">
            <span className="material-symbols text-sm" aria-hidden>
              close
            </span>
          </span>
        </ButtonBase>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={t('ButtonReset')}
        message={t('MessageConfirmResetProgress')}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </>
  )
}
