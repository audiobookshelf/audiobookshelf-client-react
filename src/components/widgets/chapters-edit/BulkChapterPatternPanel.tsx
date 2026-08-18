'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BulkChapterPattern } from '@/lib/chapters/chapterEditorUtils'
import { formatNumberWithPadding } from '@/lib/chapters/chapterEditorUtils'

interface BulkChapterPatternPanelProps {
  detectedPattern: BulkChapterPattern | null
  bulkChapterCount: number
  onBulkChapterCountChange: (count: number) => void
  onClose: () => void
  onConfirm: () => void
}

export default function BulkChapterPatternPanel({
  detectedPattern,
  bulkChapterCount,
  onBulkChapterCountChange,
  onClose,
  onConfirm
}: BulkChapterPatternPanelProps) {
  const t = useTypeSafeTranslations()

  if (!detectedPattern) return null

  return (
    <div className="border-border bg-primary/10 mb-4 rounded-lg border p-4 text-sm">
      <p className="mb-3 text-base">{t('MessageBulkChapterPattern')}</p>

      <div className="bg-primary/25 text-foreground-muted mb-4 rounded p-2 text-sm">
        {t.rich('MessageDetectedPatternWithValue', {
          0: `${detectedPattern.before}${formatNumberWithPadding(detectedPattern.startingNumber, detectedPattern)}${detectedPattern.after}`,
          strong: (chunks) => <strong>{chunks}</strong>
        })}
        <br />
        {t.rich('MessageNextChaptersWithExamples', {
          0: `${detectedPattern.before}${formatNumberWithPadding(detectedPattern.startingNumber + 1, detectedPattern)}${detectedPattern.after}`,
          1: `${detectedPattern.before}${formatNumberWithPadding(detectedPattern.startingNumber + 2, detectedPattern)}${detectedPattern.after}`,
          strong: (chunks) => <strong>{chunks}</strong>
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-base font-medium">{t('LabelNumberOfChapters')}</label>
        <TextInput
          type="number"
          value={String(bulkChapterCount)}
          className="w-14"
          onChange={(value) => onBulkChapterCountChange(Number(value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
          }}
        />
        <div className="grow" />
        <Btn size="small" onClick={onClose}>
          {t('ButtonCancel')}
        </Btn>
        <Btn size="small" color="bg-success" onClick={onConfirm}>
          {t('ButtonAddChapters')}
        </Btn>
      </div>
    </div>
  )
}
