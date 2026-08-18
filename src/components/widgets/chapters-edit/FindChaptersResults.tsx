'use client'

import Checkbox from '@/components/ui/Checkbox'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import ChapterTransformPreview from '@/components/widgets/chapters-edit/ChapterTransformPreview'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { audibleChapterRowClass, getAudibleChapterOverflow, getChapterTimeOverflow, type EditableChapter } from '@/lib/chapters/chapterEditorUtils'
import type { AudibleChapterSearchResult } from '@/types/api'
import { useCallback } from 'react'

interface ChapterPreviewState {
  selectedChapterId: number | string | null
  isPlayingChapter: boolean
  isLoadingChapter: boolean
  elapsedTime: number
  playChapter: (chapterId: number | string, start: number) => void
  destroyAudioEl: () => void
}

interface FindChaptersResultsProps {
  lookupResult: AudibleChapterSearchResult
  currentChapters: EditableChapter[]
  afterChapters: EditableChapter[]
  mediaDuration: number
  preview: ChapterPreviewState
  tracks: { startOffset: number; duration: number }[]
  mapChapterTitles: boolean
  removeBranding: boolean
  applyDisabled?: boolean
  previewShiftAmount?: number
  onPreviewShiftAmountChange?: (amount: number) => void
  onMapChapterTitlesChange: (value: boolean) => void
  onRemoveBrandingChange: (value: boolean) => void
  onApply: () => void
}

export default function FindChaptersResults({
  lookupResult,
  currentChapters,
  afterChapters,
  mediaDuration,
  preview,
  tracks,
  mapChapterTitles,
  removeBranding,
  applyDisabled,
  previewShiftAmount,
  onPreviewShiftAmountChange,
  onMapChapterTitlesChange,
  onRemoveBrandingChange,
  onApply
}: FindChaptersResultsProps) {
  const t = useTypeSafeTranslations()

  const getAfterRowAppearance = useCallback(
    (index: number, after: EditableChapter | undefined) => {
      const fallbackClass = index % 2 === 0 ? 'bg-primary/30' : ''
      if (!after) return { className: fallbackClass }

      const overflow = getChapterTimeOverflow(after.start, after.end, mediaDuration)
      if (overflow) {
        return {
          className: overflow === 'start' ? 'bg-error/20' : 'bg-warning/20',
          tooltip: overflow === 'start' ? t('MessageChapterStartIsAfter') : t('MessageChapterEndIsAfter')
        }
      }

      if (mapChapterTitles) {
        return { className: fallbackClass }
      }
      const found = lookupResult.chapters[index]
      if (!found) return { className: fallbackClass }
      const foundOverflow = getAudibleChapterOverflow(found, mediaDuration)
      return {
        className: audibleChapterRowClass(found, index, mediaDuration),
        tooltip: foundOverflow === 'start' ? t('MessageChapterStartIsAfter') : foundOverflow === 'end' ? t('MessageChapterEndIsAfter') : undefined
      }
    },
    [lookupResult.chapters, mapChapterTitles, mediaDuration, t]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChapterTransformPreview
        currentChapters={currentChapters}
        afterChapters={afterChapters}
        preview={preview}
        tracks={tracks}
        applyDisabled={applyDisabled}
        getAfterRowAppearance={getAfterRowAppearance}
        previewShiftAmount={previewShiftAmount}
        onPreviewShiftAmountChange={onPreviewShiftAmountChange}
        extraActions={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Checkbox value={mapChapterTitles} label={t('ButtonMapChapterTitles')} size="small" onChange={onMapChapterTitlesChange} />
              <HelpTooltipIcon text={t('MessageMapChapterTitles')} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox value={removeBranding} label={t('LabelRemoveAudibleBrandingShort')} size="small" onChange={onRemoveBrandingChange} />
              <HelpTooltipIcon text={t('LabelRemoveAudibleBranding')} />
            </div>
          </div>
        }
        onApply={onApply}
      />
    </div>
  )
}
