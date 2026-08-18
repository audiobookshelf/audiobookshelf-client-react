'use client'

import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import ChaptersToolbarPanel from './ChaptersToolbarPanel'

interface ShiftTimesFieldsProps {
  shiftAmount: number
  onShiftAmountChange: (value: number) => void
  showHelp?: boolean
}

export function ShiftTimesFields({ shiftAmount, onShiftAmountChange, showHelp = false }: ShiftTimesFieldsProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <p className="text-sm font-semibold whitespace-nowrap">{showHelp ? t('LabelTimeToShiftShort') : t('LabelTimeToShift')}</p>
      <TextInput type="number" value={String(shiftAmount)} size="small" className="max-w-20" onChange={(value) => onShiftAmountChange(Number(value))} />
      {showHelp ? <HelpTooltipIcon text={t('NoteChapterEditorTimes')} /> : null}
    </div>
  )
}

interface ShiftTimesPanelProps {
  shiftAmount: number
  onShiftAmountChange: (value: number) => void
  onClose: () => void
}

export default function ShiftTimesPanel({ shiftAmount, onShiftAmountChange, onClose }: ShiftTimesPanelProps) {
  const t = useTypeSafeTranslations()

  return (
    <ChaptersToolbarPanel onClose={onClose}>
      <div className="flex h-full flex-col justify-between gap-2">
        <ShiftTimesFields shiftAmount={shiftAmount} onShiftAmountChange={onShiftAmountChange} />
        <p className="text-foreground-muted max-w-md text-xs">{t('NoteChapterEditorTimes')}</p>
      </div>
    </ChaptersToolbarPanel>
  )
}
