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
}

export default function CoverMatchFieldEditor({ usageChecked, onUsageChange, coverUrl, currentCoverUrl }: CoverMatchFieldEditorProps) {
  const t = useTypeSafeTranslations()

  const displayCoverUrl = useMemo(() => coverUrl || '', [coverUrl])

  return (
    <div className="flex flex-wrap items-center justify-center md:flex-nowrap">
      <div className="flex grow items-center py-2">
        <Checkbox value={usageChecked} onChange={onUsageChange} checkboxBgClass="bg-bg" />
        <TextInput value={displayCoverUrl} onChange={() => {}} disabled={!usageChecked} readOnly label={t('LabelCover')} className="mx-4 grow" />
      </div>
      <div className="flex gap-2 py-2">
        <div>
          <p className="text-foreground-muted text-center">{t('LabelNew')}</p>
          <a href={displayCoverUrl} target="_blank" rel="noopener noreferrer" className="bg-primary">
            <PreviewCover src={displayCoverUrl} width={100} />
          </a>
        </div>
        {currentCoverUrl && (
          <div>
            <p className="text-foreground-muted text-center">{t('LabelCurrent')}</p>
            <a href={currentCoverUrl} target="_blank" rel="noopener noreferrer" className="bg-primary">
              <PreviewCover src={currentCoverUrl} width={100} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
