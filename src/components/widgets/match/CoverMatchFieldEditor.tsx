'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Checkbox from '@/components/ui/Checkbox'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useMemo } from 'react'

interface CoverMatchFieldEditorProps {
  usageChecked: boolean
  onUsageChange: (value: boolean) => void
  coverUrl: string
  currentCoverUrl: string | null
  bookCoverAspectRatio: number
}

export default function CoverMatchFieldEditor({ usageChecked, onUsageChange, coverUrl, currentCoverUrl, bookCoverAspectRatio }: CoverMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const displayCoverUrl = useMemo(() => coverUrl || '', [coverUrl])

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center justify-center">
      <div className="flex grow items-center py-2">
        <Checkbox value={usageChecked} onChange={onUsageChange} checkboxBgClass="bg-bg" />
        <TextInput value={displayCoverUrl} onChange={() => {}} disabled={!usageChecked} readOnly label={t('LabelCover')} className="grow mx-4" />
      </div>
      <div className="flex py-2">
        <div>
          <p className="text-center text-gray-200">{t('LabelNew')}</p>
          <a href={displayCoverUrl} target="_blank" rel="noopener noreferrer" className="bg-primary">
            <PreviewCover src={displayCoverUrl} width={100} bookCoverAspectRatio={bookCoverAspectRatio} />
          </a>
        </div>
        {currentCoverUrl && (
          <div className="ml-0.5">
            <p className="text-center text-gray-200">{t('LabelCurrent')}</p>
            <a href={currentCoverUrl} target="_blank" rel="noopener noreferrer" className="bg-primary">
              <PreviewCover src={currentCoverUrl} width={100} bookCoverAspectRatio={bookCoverAspectRatio} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
