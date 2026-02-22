'use client'

import Btn from '@/components/ui/Btn'
import DataTable from '@/components/ui/DataTable'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface ChaptersTableProps {
  libraryItem: BookLibraryItem
  user: User
  keepOpen?: boolean
  expanded?: boolean
}

export default function ChaptersTable({ libraryItem, user, keepOpen = false, expanded: expandedProp = false }: ChaptersTableProps) {
  const t = useTypeSafeTranslations()
  const [expanded, setExpanded] = useState(expandedProp)

  const chapters = useMemo<Chapter[]>(() => libraryItem.media.chapters || [], [libraryItem.media.chapters])
  const userCanUpdate = useMemo(() => user.permissions?.update || false, [user.permissions])

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

  // Minimum widths for columns (in pixels)
  // Duration: min-w-16 = 64px (w-16 = 4rem = 64px) for timestamp display
  // Id: min-w-16 = 64px (w-16 = 4rem = 64px) for id display
  // Title: flexible, can wrap
  // Start: flexible, can wrap
  const MIN_DURATION_WIDTH = 80 // min-w-20 = 5rem = 80px
  const MIN_ID_WIDTH = 64 // min-w-16 = 4rem = 64px
  const TABLE_BORDER = 2 // 1px border on each side
  const TITLE_MIN_WIDTH = 100 // Minimum width for title column to be readable
  const START_MIN_WIDTH = 80 // Minimum width for start column to be readable

  // Calculate minTableWidth for each column
  // Reserved space = Title + Start + Border
  const RESERVED_WIDTH = TITLE_MIN_WIDTH + START_MIN_WIDTH + TABLE_BORDER

  // Id requires RESERVED_WIDTH + ID_WIDTH
  const ID_MIN_TABLE_WIDTH = RESERVED_WIDTH + MIN_ID_WIDTH

  // Duration requires RESERVED_WIDTH + ID_WIDTH + DURATION_WIDTH (assuming Id is shown first)
  // OR just RESERVED + DURATION depending on priority?
  // Original logic:
  // Show Id if width >= RESERVED + ID
  // Show Duration if width >= RESERVED + ID + DURATION (implies Duration has lower priority than ID)
  const DURATION_MIN_TABLE_WIDTH = ID_MIN_TABLE_WIDTH + MIN_DURATION_WIDTH

  const columns = useMemo(
    () => [
      {
        label: 'Id',
        accessor: 'id' as const,
        headerClassName: 'text-start w-16 px-4',
        cellClassName: 'text-start px-2 px-4',
        minTableWidth: ID_MIN_TABLE_WIDTH,
        hiddenBelow: 'sm' as const
      },
      {
        label: t('LabelTitle'),
        accessor: 'title' as const,
        headerClassName: 'text-start px-2',
        cellClassName: 'px-2'
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
        minTableWidth: DURATION_MIN_TABLE_WIDTH,
        hiddenBelow: 'md' as const
      }
    ],
    [t, handleGoToTimestamp, ID_MIN_TABLE_WIDTH, DURATION_MIN_TABLE_WIDTH]
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
