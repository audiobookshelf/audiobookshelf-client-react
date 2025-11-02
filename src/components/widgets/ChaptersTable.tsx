'use client'

import Btn from '@/components/ui/Btn'
import CollapsibleTable from '@/components/ui/CollapsibleTable'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useCallback, useMemo, useState } from 'react'
import ChapterTableRow from './ChapterTableRow'

interface ChaptersTableProps {
  libraryItem: BookLibraryItem
  user: User
  keepOpen?: boolean
}

export default function ChaptersTable({ libraryItem, user, keepOpen = false }: ChaptersTableProps) {
  const t = useTypeSafeTranslations()
  const [expanded, setExpanded] = useState(false)

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const userCanUpdate = useMemo(() => user.permissions?.update || false, [user.permissions])

  const handleGoToTimestamp = useCallback((time: number) => {
    // TODO: Implement playback at timestamp
    // Original functionality:
    // - Check if media is currently streaming
    // - If streaming: emit play-item event with startTime
    // - If not streaming: show confirmation prompt, then emit play-item event with startTime
    console.log('Go to timestamp:', time)
  }, [])

  const tableHeaders = useMemo(
    () => [
      { label: 'Id', className: 'text-start w-16 px-6' },
      { label: t('LabelTitle'), className: 'text-start px-2' },
      { label: t('LabelStart'), className: 'text-center px-2' },
      { label: t('LabelDuration'), className: 'text-center px-2' }
    ],
    [t]
  )

  const headerActions = useMemo(
    () =>
      userCanUpdate ? (
        <Btn
          to={`/item/${libraryItem.id}/chapters`}
          color="bg-primary"
          size="small"
          className="me-2"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {t('ButtonEditChapters')}
        </Btn>
      ) : null,
    [userCanUpdate, libraryItem.id, t]
  )

  return (
    <CollapsibleTable
      title={t('HeaderChapters')}
      count={chapters.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
      tableHeaders={tableHeaders}
    >
      {chapters.map((chapter) => (
        <ChapterTableRow key={chapter.id} chapter={chapter} onGoToTimestamp={handleGoToTimestamp} />
      ))}
    </CollapsibleTable>
  )
}
