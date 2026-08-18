'use client'

import IconBtn from '@/components/ui/IconBtn'
import ChaptersToolbarPanel from '@/components/widgets/chapters-edit/ChaptersToolbarPanel'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import type { AudibleChapterSearchResult } from '@/types/api'

interface FindChaptersStatsPanelProps {
  lookupResult: AudibleChapterSearchResult
  currentChapterCount: number
  mediaDurationRounded: number
  onBack: () => void
  onClose: () => void
}

export default function FindChaptersStatsPanel({ lookupResult, currentChapterCount, mediaDurationRounded, onBack, onClose }: FindChaptersStatsPanelProps) {
  const t = useTypeSafeTranslations()
  const foundChapterCount = lookupResult.chapters.length
  const countsDiffer = currentChapterCount !== foundChapterCount
  const durationShorter = lookupResult.runtimeLengthSec > mediaDurationRounded
  const durationLonger = lookupResult.runtimeLengthSec < mediaDurationRounded

  return (
    <ChaptersToolbarPanel onClose={onClose}>
      <div className="flex h-full flex-col justify-between gap-1">
        <div className="flex min-h-0 flex-wrap items-center gap-x-4 gap-y-1">
          <IconBtn ariaLabel={t('ButtonBack')} borderless size="small" onClick={onBack}>
            arrow_back
          </IconBtn>
          <p className="text-sm">
            {t('LabelDurationFound')} <span className="font-semibold">{secondsToTimestamp(lookupResult.runtimeLengthSec)}</span>
            <br />
            <span className={countsDiffer ? 'text-warning font-semibold' : 'font-semibold'}>{foundChapterCount}</span> {t('LabelChaptersFound')}
          </p>
          <div className="grow" />
          <p className="text-sm">
            {t('LabelYourAudiobookDurationWithValue', { 0: secondsToTimestamp(mediaDurationRounded) })}
            <br />
            {t.rich('MessageYourAudiobookChapterCount', {
              0: currentChapterCount,
              count: (chunks) => <span className={countsDiffer ? 'text-warning font-semibold' : 'font-semibold'}>{chunks}</span>
            })}
          </p>
        </div>

        {(durationShorter || durationLonger) && (
          <p className="text-warning flex items-center gap-1 text-xs" role="status">
            <span className="material-symbols text-sm" aria-hidden="true">
              warning
            </span>
            {durationShorter ? t('MessageYourAudiobookDurationIsShorter') : t('MessageYourAudiobookDurationIsLonger')}
          </p>
        )}
      </div>
    </ChaptersToolbarPanel>
  )
}
