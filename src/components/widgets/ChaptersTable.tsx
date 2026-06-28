'use client'

import Btn from '@/components/ui/Btn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { BookLibraryItem, Chapter } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface ChaptersTableProps {
  libraryItem: BookLibraryItem
  keepOpen?: boolean
  expanded?: boolean
}

export default function ChaptersTable({ libraryItem, keepOpen = false, expanded: expandedProp = false }: ChaptersTableProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate } = useUser()
  const [expanded, setExpanded] = useState(expandedProp)

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const isEmpty = chapters.length === 0

  // Sync expanded state with props (keepOpen takes precedence)
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  const handleGoToTimestamp = useCallback((time: number) => {
    // TODO: Implement playback at timestamp
    // Original functionality:
    // - Check if media is currently streaming
    // - If streaming: emit play-item event with startTime
    // - If not streaming: show confirmation prompt, then emit play-item event with startTime
    console.log('Go to timestamp:', time)
  }, [])

  const columns = useMemo(
    () => [
      {
        label: t('LabelTitle'),
        accessor: 'title' as const,
        headerClassName: 'text-start px-4',
        cellClassName: 'px-4'
      },
      {
        label: t('LabelStart'),
        headerClassName: 'text-center px-2',
        cellClassName: 'text-center px-2',
        accessor: (row: Chapter) => (
          <div
            className="cursor-pointer text-center font-mono hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              handleGoToTimestamp(row.start)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                handleGoToTimestamp(row.start)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Go to timestamp ${secondsToTimestamp(row.start)}`}
          >
            {secondsToTimestamp(row.start)}
          </div>
        )
      },
      {
        label: t('LabelDuration'),
        headerClassName: 'text-center px-2 w-16 md:w-24 min-w-16 md:min-w-24',
        cellClassName: 'text-center px-2 font-mono',
        accessor: (row: Chapter) => secondsToTimestamp(Math.max(0, row.end - row.start)),
        hiddenBelow: 'md' as const
      }
    ],
    [t, handleGoToTimestamp]
  )

  const chaptersPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`

  const headerActions = useMemo(
    () =>
      userCanUpdate ? (
        <Btn
          to={chaptersPath}
          color="bg-primary"
          size="small"
          className="me-2"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {isEmpty ? t('ButtonAddChapters') : t('ButtonEditChapters')}
        </Btn>
      ) : null,
    [userCanUpdate, chaptersPath, isEmpty, t]
  )

  if (isEmpty && !userCanUpdate) {
    return null
  }

  return (
    <CollapsibleSection
      title={t('HeaderChapters')}
      count={chapters.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
    >
      {isEmpty ? (
        <div className="py-4 text-center" role="status">
          <p className="text-foreground-muted">{t('MessageNoChapters')}</p>
        </div>
      ) : (
        <SimpleDataTable data={chapters} columns={columns} getRowKey={(row) => row.id} />
      )}
    </CollapsibleSection>
  )
}
