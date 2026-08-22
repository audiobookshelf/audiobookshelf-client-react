'use client'

import Modal from '@/components/modals/Modal'
import ModalFooter from '@/components/modals/ModalFooter'
import ModalOuterContent from '@/components/modals/ModalOuterContent'
import TextInput from '@/components/ui/TextInput'
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

  const outerContent = <ModalOuterContent>{t('HeaderBulkChapterModal')}</ModalOuterContent>

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ width: 400 }} outerContent={outerContent}>
      <div className="bg-bg border-border flex w-full flex-col rounded-lg border text-sm shadow-lg">
        <div className="flex flex-col gap-8 p-6">
          <p className="text-base">{t('MessageBulkChapterPattern')}</p>

          {detectedPattern && (
            <div className="bg-primary/25 text-foreground-muted rounded p-2 text-sm">
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
        </div>

        <ModalFooter secondary={{ label: t('ButtonCancel'), onClick: onClose }} primary={{ label: t('ButtonAddChapters'), onClick: onConfirm }} />
      </div>
    </Modal>
  )
}
