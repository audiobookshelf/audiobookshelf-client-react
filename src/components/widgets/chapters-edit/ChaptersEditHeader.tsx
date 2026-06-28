'use client'

import IconBtn from '@/components/ui/IconBtn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import Link from 'next/link'

interface ChaptersEditHeaderProps {
  libraryId: string
  itemId: string
  title: string
  mediaDurationRounded: number
  onEditClick: () => void
}

export default function ChaptersEditHeader({ libraryId, itemId, title, mediaDurationRounded, onEditClick }: ChaptersEditHeaderProps) {
  const t = useTypeSafeTranslations()

  return (
    <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
      <Link href={`/library/${libraryId}/item/${itemId}`} className="hover:underline">
        <h1 className="text-lg lg:text-xl">{title}</h1>
      </Link>
      <IconBtn ariaLabel={t('ButtonEdit')} borderless size="small" className="mx-4" onClick={onEditClick}>
        edit
      </IconBtn>
      <div className="hidden grow md:block" />
      <p className="hidden text-base md:block">{t('LabelDuration')}:</p>
      <p className="ms-4 hidden font-mono text-base md:block">{secondsToTimestamp(mediaDurationRounded)}</p>
    </div>
  )
}
