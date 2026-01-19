'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useMemo } from 'react'
import ChaptersAccordion from './ChaptersAccordion'

interface ChaptersProps {
  libraryItem: BookLibraryItem
  user: User
  className?: string
}

export default function Chapters({ libraryItem, user, className }: ChaptersProps) {
  const t = useTypeSafeTranslations()

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const userCanUpdate = useMemo(() => user.permissions?.update || false, [user.permissions])

  return (
    <>
      {chapters.length > 0 ? (
        <ChaptersAccordion libraryItem={libraryItem} user={user} className={className} />
      ) : (
        <div className="py-4 text-center" role="status">
          <p className="mb-8 text-xl">{t('MessageNoChapters')}</p>
          {userCanUpdate && <Btn to={`/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`}>{t('ButtonAddChapters')}</Btn>}
        </div>
      )}
    </>
  )
}
