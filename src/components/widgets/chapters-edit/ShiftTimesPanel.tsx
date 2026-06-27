'use client'

import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface ShiftTimesPanelProps {
  shiftAmount: number
  onShiftAmountChange: (value: number) => void
  onShift: () => void
  onClose: () => void
}

export default function ShiftTimesPanel({ shiftAmount, onShiftAmountChange, onShift, onClose }: ShiftTimesPanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="mb-4 flex">
      <div className="hidden w-12 lg:block" />
      <div className="grow">
        <div className="flex items-center">
          <p className="mb-1 pr-2 text-sm font-semibold">{t('LabelTimeToShift')}</p>
          <TextInput
            type="number"
            value={String(shiftAmount)}
            size="small"
            className="max-w-20"
            onChange={(value) => onShiftAmountChange(Number(value))}
          />
          <Btn color="bg-primary" size="small" className="mx-1" onClick={onShift}>
            {t('ButtonAdd')}
          </Btn>
          <div className="grow" />
          <IconBtn ariaLabel={t('ButtonClose')} borderless size="small" onClick={onClose}>
            expand_less
          </IconBtn>
        </div>
        <p className="max-w-md py-1.5 text-xs text-gray-300">{t('NoteChapterEditorTimes')}</p>
      </div>
      <div className="hidden w-32 lg:block" />
    </div>
  )
}
