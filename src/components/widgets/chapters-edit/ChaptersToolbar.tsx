'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'

interface ChaptersToolbarProps {
  savedChapterCount: number
  chapterCount: number
  hasChanges: boolean
  showShiftTimes: boolean
  onRemoveAll: () => void
  onToggleShiftTimes: () => void
  onLookup: () => void
  onReset: () => void
  onSave: () => void
}

export default function ChaptersToolbar({
  savedChapterCount,
  chapterCount,
  hasChanges,
  showShiftTimes,
  onRemoveAll,
  onToggleShiftTimes,
  onLookup,
  onReset,
  onSave
}: ChaptersToolbarProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="-mx-1 mb-3 flex items-center py-1">
      <div className="hidden w-12 min-[1120px]:block" />
      {savedChapterCount > 0 && chapterCount > 0 && (
        <Btn color="bg-primary" size="small" className="mx-1 whitespace-nowrap" onClick={onRemoveAll}>
          {t('ButtonRemoveAll')}
        </Btn>
      )}
      {chapterCount > 1 && (
        <Btn color={showShiftTimes ? 'bg-bg' : 'bg-primary'} size="small" className="mx-1 whitespace-nowrap" onClick={onToggleShiftTimes}>
          {t('ButtonShiftTimes')}
        </Btn>
      )}
      <Btn color="bg-primary" size="small" className={chapterCount > 1 ? 'mx-1' : ''} onClick={onLookup}>
        {t('ButtonLookup')}
      </Btn>
      <div className="grow" />
      {hasChanges && (
        <Btn size="small" className="mx-1" onClick={onReset}>
          {t('ButtonReset')}
        </Btn>
      )}
      {hasChanges && (
        <Btn color="bg-success" size="small" className="mx-1" disabled={!hasChanges} onClick={onSave}>
          {t('ButtonSave')}
        </Btn>
      )}
      <div className="hidden w-32 min-[1120px]:block" />
    </div>
  )
}
