'use client'

import Btn from '@/components/ui/Btn'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useMemo } from 'react'
import ChaptersTable from './ChaptersTable'

interface ChaptersProps {
  libraryItem: BookLibraryItem
  user: User
}

export default function Chapters({ libraryItem, user }: ChaptersProps) {
  const t = useTypeSafeTranslations()

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const userCanUpdate = useMemo(() => user.permissions?.update || false, [user.permissions])

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden px-4 py-6" role="region" aria-label={t('HeaderChapters')}>
      <div className="w-full mb-4">
        {chapters.length > 0 ? (
          <ChaptersTable libraryItem={libraryItem} user={user} keepOpen />
        ) : (
          <div className="py-4 text-center" role="status">
            <p className="mb-8 text-xl">{t('MessageNoChapters')}</p>
            {userCanUpdate && <Btn to={`/item/${libraryItem.id}/chapters`}>{t('ButtonAddChapters')}</Btn>}
          </div>
        )}
      </div>
    </div>
  )
}
