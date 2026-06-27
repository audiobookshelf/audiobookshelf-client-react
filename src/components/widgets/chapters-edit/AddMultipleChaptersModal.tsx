'use client'

import Btn from '@/components/ui/Btn'
import TextInput from '@/components/ui/TextInput'
import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { BulkChapterPattern } from '@/lib/chapters/chapterEditorUtils'
import { formatNumberWithPadding } from '@/lib/chapters/chapterEditorUtils'

interface AddMultipleChaptersModalProps {
  isOpen: boolean
  detectedPattern: BulkChapterPattern | null
  bulkChapterCount: number
  onBulkChapterCountChange: (count: number) => void
  onClose: () => void
  onConfirm: () => void
}

export default function AddMultipleChaptersModal({
  isOpen,
  detectedPattern,
  bulkChapterCount,
  onBulkChapterCountChange,
  onClose,
  onConfirm
}: AddMultipleChaptersModalProps) {
  const t = useTypeSafeTranslations()

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="max-w-[calc(100vw-4rem)] truncate text-xl text-white">{t('HeaderBulkChapterModal')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ width: 400 }} outerContent={outerContent}>
      <div className="bg-bg border-black-300 relative max-h-full w-full rounded-lg border p-6 text-sm shadow-lg">
        <div className="flex flex-col gap-8">
          <p className="text-base">{t('MessageBulkChapterPattern')}</p>

          {detectedPattern && (
            <div className="rounded bg-gray-800 p-2 text-sm text-gray-400">
              <strong>{t('LabelDetectedPattern')}</strong> &quot;{detectedPattern.before}
              {formatNumberWithPadding(detectedPattern.startingNumber, detectedPattern)}
              {detectedPattern.after}&quot;
              <br />
              <strong>{t('LabelNextChapters')}</strong> &quot;{detectedPattern.before}
              {formatNumberWithPadding(detectedPattern.startingNumber + 1, detectedPattern)}
              {detectedPattern.after}&quot;, &quot;{detectedPattern.before}
              {formatNumberWithPadding(detectedPattern.startingNumber + 2, detectedPattern)}
              {detectedPattern.after}&quot;, etc.
            </div>
          )}

          <div className="flex items-center px-1">
            <label className="text-base font-medium">{t('LabelNumberOfChapters')}</label>
            <div className="grow" />
            <TextInput
              type="number"
              value={String(bulkChapterCount)}
              className="w-14"
              onChange={(value) => onBulkChapterCountChange(Number(value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm()
              }}
            />
          </div>

          <div className="flex items-center px-1">
            <Btn size="small" onClick={onClose}>
              {t('ButtonCancel')}
            </Btn>
            <div className="grow" />
            <Btn size="small" color="bg-success" onClick={onConfirm}>
              {t('ButtonAddChapters')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
