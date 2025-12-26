'use client'

import Btn from '@/components/ui/Btn'
import CollapsibleTable from '@/components/ui/CollapsibleTable'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { BookLibraryItem, Chapter, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChapterTableRow from './ChapterTableRow'

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

  // Measure table width to determine which columns can fit
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [tableWidth, setTableWidth] = useState<number | null>(null)
  const isExpanded = keepOpen || expanded

  useEffect(() => {
    if (!isExpanded || !tableContainerRef.current) {
      setTableWidth(null)
      return
    }

    const updateWidth = () => {
      const width = tableContainerRef.current!.getBoundingClientRect().width
      setTableWidth(width)
    }

    // Set initial width
    updateWidth()

    // Use ResizeObserver on the container element
    const resizeObserver = new ResizeObserver(() => {
      updateWidth()
    })

    resizeObserver.observe(tableContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isExpanded])

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

  // Calculate which columns can fit based on available width
  const { showDuration, showId } = useMemo(() => {
    if (tableWidth === null) {
      // Default to showing both on first render
      return { showDuration: true, showId: true }
    }

    // Always reserve space for Title (minimum) + Start (minimum)
    const reservedWidth = TITLE_MIN_WIDTH + START_MIN_WIDTH + TABLE_BORDER
    const availableWidth = tableWidth - reservedWidth

    // Determine what fits
    // If we have space for Id, show it first
    const canShowId = availableWidth >= MIN_ID_WIDTH
    // If we have space for both Id and Duration, add Duration
    const canShowDuration = canShowId && availableWidth >= MIN_ID_WIDTH + MIN_DURATION_WIDTH
    return {
      showDuration: canShowDuration,
      showId: canShowId
    }
  }, [tableWidth])

  const tableHeaders = useMemo(
    () => [
      ...(showId ? [{ label: 'Id', className: 'text-start w-16 px-6' }] : []),
      { label: t('LabelTitle'), className: 'text-start px-2' },
      { label: t('LabelStart'), className: 'text-center px-2' },
      ...(showDuration ? [{ label: t('LabelDuration'), className: 'text-center px-2 w-16 md:w-24 min-w-16 md:min-w-24' }] : [])
    ],
    [t, showDuration, showId]
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
    <CollapsibleTable
      title={t('HeaderChapters')}
      count={chapters.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
      tableHeaders={tableHeaders}
      containerRef={tableContainerRef}
    >
      {chapters.map((chapter) => (
        <ChapterTableRow key={chapter.id} chapter={chapter} onGoToTimestamp={handleGoToTimestamp} showDuration={showDuration} showId={showId} />
      ))}
    </CollapsibleTable>
  )
}
