'use client'

import Btn from '@/components/ui/Btn'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, Chapter } from '@/types/api'
import { useMemo } from 'react'
import ChaptersTable from './ChaptersTable'

interface ChaptersProps {
  libraryItem: BookLibraryItem
}

export default function Chapters({ libraryItem }: ChaptersProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate } = useUser()

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])

  return (
    <div className="h-full w-full overflow-x-hidden overflow-y-auto px-4 py-6" role="region" aria-label={t('HeaderChapters')}>
      <div className="mb-4 w-full">
        {chapters.length > 0 ? (
          <ChaptersTable libraryItem={libraryItem} keepOpen />
        ) : (
          <div className="py-4 text-center" role="status">
            <p className="mb-8 text-xl">{t('MessageNoChapters')}</p>
            {userCanUpdate && <Btn to={`/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`}>{t('ButtonAddChapters')}</Btn>}
          </div>
        )}
      </div>
    </div>
  )
}
