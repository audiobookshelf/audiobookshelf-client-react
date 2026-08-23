'use client'

import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
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
        label: t('LabelId'),
        accessor: 'id' as const,
        headerClassName: 'w-12 min-w-12 px-2 text-start md:w-16 md:min-w-16 md:px-4',
        cellClassName: 'w-12 min-w-12 px-2 text-start md:w-16 md:min-w-16 md:px-4',
        hiddenBelow: 'sm' as const
      },
      {
        label: t('LabelTitle'),
        accessor: (row: Chapter) => <span className="break-words">{row.title}</span>,
        headerClassName: 'min-w-0 px-2 text-start md:px-4',
        cellClassName: 'max-w-0 min-w-0 px-2 md:px-4'
      },
      {
        label: t('LabelStart'),
        headerClassName: 'w-20 min-w-20 px-2 text-center md:w-24 md:min-w-24',
        cellClassName: 'w-20 min-w-20 px-2 text-center md:w-24 md:min-w-24',
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
        headerClassName: 'w-24 min-w-24 px-2 pe-3 text-center',
        cellClassName: 'w-24 min-w-24 px-2 pe-3 text-center font-mono',
        accessor: (row: Chapter) => secondsToTimestamp(Math.max(0, row.end - row.start))
      }
    ],
    [t, handleGoToTimestamp]
  )

  const chaptersPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}/chapters`

  const chaptersActionLabel = isEmpty ? t('ButtonAddChapters') : t('ButtonEditChapters')

  const headerActions = useMemo(
    () =>
      userCanUpdate ? (
        <Tooltip text={chaptersActionLabel} position="top">
          <span className="me-2 inline-flex">
            <IconBtn
              to={chaptersPath}
              size="small"
              ariaLabel={chaptersActionLabel}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              {isEmpty ? 'add' : 'edit'}
            </IconBtn>
          </span>
        </Tooltip>
      ) : null,
    [userCanUpdate, chaptersPath, chaptersActionLabel, isEmpty]
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
        <SimpleDataTable data={chapters} columns={columns} getRowKey={(row) => row.id} tableClassName="table-fixed" />
      )}
    </CollapsibleSection>
  )
}
