'use client'

import Btn from '@/components/ui/Btn'
import DataTable from '@/components/ui/DataTable'
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
            className="font-mono text-center hover:underline cursor-pointer"
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

  const headerActions = useMemo(
    () =>
      userCanUpdate ? (
        <Btn
          to={`/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`}
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
    [userCanUpdate, libraryItem.libraryId, libraryItem.id, t]
  )

  return (
    <CollapsibleSection
      title={t('HeaderChapters')}
      count={chapters.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
    >
      <DataTable data={chapters} columns={columns} getRowKey={(row) => row.id} />
    </CollapsibleSection>
  )
}
