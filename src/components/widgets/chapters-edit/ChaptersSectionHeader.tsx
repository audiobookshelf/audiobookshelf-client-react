'use client'

import Checkbox from '@/components/ui/Checkbox'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface ChaptersSectionHeaderProps {
  showSecondInputs: boolean
  onShowSecondInputsChange: (value: boolean) => void
}

export default function ChaptersSectionHeader({ showSecondInputs, onShowSecondInputsChange }: ChaptersSectionHeaderProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="mb-4 flex items-center">
      <div className="hidden w-12 xl:block" />
      <p className="text-lg font-semibold">{t('HeaderChapters')}</p>
      <div className="grow" />
      <Checkbox value={showSecondInputs} label={t('LabelShowSeconds')} size="small" className="mx-2" onChange={onShowSecondInputsChange} />
      <div className="hidden w-8 xl:block" />
    </div>
  )
}
