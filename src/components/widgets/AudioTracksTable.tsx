'use client'

import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import DataTable from '@/components/ui/DataTable'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { bytesPretty } from '@/lib/string'
import { AudioFile, AudioTrack, BookLibraryItem, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

const MIN_INDEX_WIDTH = 40
const MIN_ACTIONS_WIDTH = 44
const MIN_HIDEABLE_COLUMN_WIDTH = 80
const TABLE_BORDER = 2
const PATH_MIN_WIDTH = 300

// Calculate minTableWidth for columns
const BASE_WIDTH = PATH_MIN_WIDTH + TABLE_BORDER + MIN_ACTIONS_WIDTH + MIN_INDEX_WIDTH
const DURATION_MIN_TABLE_WIDTH = BASE_WIDTH + MIN_HIDEABLE_COLUMN_WIDTH
const SIZE_MIN_TABLE_WIDTH = DURATION_MIN_TABLE_WIDTH + MIN_HIDEABLE_COLUMN_WIDTH
const BITRATE_MIN_TABLE_WIDTH = SIZE_MIN_TABLE_WIDTH + MIN_HIDEABLE_COLUMN_WIDTH
const CODEC_MIN_TABLE_WIDTH = BITRATE_MIN_TABLE_WIDTH + MIN_HIDEABLE_COLUMN_WIDTH

interface AudioTracksTableProps {
  libraryItem: BookLibraryItem
  user: User
  keepOpen?: boolean
  expanded?: boolean
  className?: string
}

interface TrackWithAudioFile extends AudioTrack {
  audioFile?: AudioFile
}

export default function AudioTracksTable({ libraryItem, user, keepOpen = false, expanded: expandedProp = false, className }: AudioTracksTableProps) {
  const t = useTypeSafeTranslations()
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)

  const userCanDownload = user.permissions?.download || false
  const userCanDelete = user.permissions?.delete || false
  const userIsAdmin = user.type === 'admin' || user.type === 'root'

  // Sync expanded state with props
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  // Load showFullPath from localStorage (admin only)
  useEffect(() => {
    if (userIsAdmin) {
      const saved = localStorage.getItem('showFullPath')
      setShowFullPath(saved === '1')
    }
  }, [userIsAdmin])

  const handleToggleFullPath = useCallback(() => {
    setShowFullPath((prev) => {
      const newValue = !prev
      localStorage.setItem('showFullPath', newValue ? '1' : '0')
      return newValue
    })
  }, [])

  const handleShowMore = useCallback((audioFile: AudioFile) => {
    // TODO: Show audio file data modal
    console.log('Show more info for:', audioFile)
  }, [])

  const tracksWithAudioFile = useMemo<TrackWithAudioFile[]>(() => {
    const tracks = libraryItem.media.tracks || []
    const audioFiles = libraryItem.media.audioFiles || []

    return tracks.map((track) => ({
      ...track,
      audioFile: audioFiles.find((af) => af.metadata.path === track.metadata.path)
    }))
  }, [libraryItem.media.tracks, libraryItem.media.audioFiles])

  const columns = useMemo(
    () => [
      {
        label: '#',
        accessor: 'index' as const,
        headerClassName: 'text-center w-10 px-2 min-w-10',
        cellClassName: 'text-center px-2 py-1 align-middle'
      },
      {
        label: t('LabelFilename'),
        accessor: (row: TrackWithAudioFile) => <span className="break-all font-sans text-sm">{showFullPath ? row.metadata.path : row.metadata.filename}</span>,
        headerClassName: 'text-start px-2 min-w-[300px]',
        cellClassName: 'text-start px-2 py-1 align-middle'
      },
      {
        label: t('LabelCodec'),
        accessor: (row: TrackWithAudioFile) => row.audioFile?.codec || '',
        headerClassName: 'text-start w-20 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        minTableWidth: CODEC_MIN_TABLE_WIDTH
      },
      {
        label: t('LabelBitrate'),
        accessor: (row: TrackWithAudioFile) => (row.audioFile?.bitRate ? bytesPretty(row.audioFile.bitRate, 0) : ''),
        headerClassName: 'text-start w-22 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        minTableWidth: BITRATE_MIN_TABLE_WIDTH
      },
      {
        label: t('LabelSize'),
        accessor: (row: TrackWithAudioFile) => bytesPretty(row.metadata.size),
        headerClassName: 'text-start w-22 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        minTableWidth: SIZE_MIN_TABLE_WIDTH
      },
      {
        label: t('LabelDuration'),
        accessor: (row: TrackWithAudioFile) => secondsToTimestamp(row.duration),
        headerClassName: 'text-start w-22 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        minTableWidth: DURATION_MIN_TABLE_WIDTH
      },
      {
        label: '',
        accessor: (row: TrackWithAudioFile) => {
          const items: ContextMenuDropdownItem[] = []
          if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
          if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })
          if (userIsAdmin && row.audioFile) items.push({ text: t('LabelMoreInfo'), action: 'more' })

          if (items.length === 0) return null

          return (
            <ContextMenuDropdown
              items={items}
              autoWidth
              size="small"
              borderless
              className="h-6 w-6 md:h-7 md:w-7"
              onAction={({ action }) => {
                if (action === 'download') {
                  const link = document.createElement('a')
                  link.href = `/internal-api/items/${libraryItem.id}/file/${row.audioFile?.ino}/download`
                  link.download = row.metadata.filename
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                } else if (action === 'delete') {
                  console.log('Delete track:', row.audioFile?.ino)
                } else if (action === 'more' && row.audioFile) {
                  handleShowMore(row.audioFile)
                }
              }}
              usePortal
            />
          )
        },
        headerClassName: 'w-12 min-w-11',
        cellClassName: 'text-center py-1 align-middle'
      }
    ],
    [t, showFullPath, userCanDownload, userCanDelete, userIsAdmin, libraryItem.id, handleShowMore]
  )

  const headerActions = useMemo(() => {
    const manageTracksBtn = user.permissions?.update ? (
      <Btn
        key="manage-tracks"
        to={`/library/${libraryItem.libraryId}/item/${libraryItem.id}/tracks`}
        color="bg-primary"
        size="small"
        className="me-2"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {t('ButtonManageTracks')}
      </Btn>
    ) : null

    const fullPathBtn = userIsAdmin ? (
      <Btn
        key="full-path"
        color={showFullPath ? 'bg-button-selected-bg' : ''}
        size="small"
        className="me-2 hidden md:inline-flex"
        onClick={(e) => {
          e.stopPropagation()
          handleToggleFullPath()
        }}
      >
        {t('ButtonFullPath')}
      </Btn>
    ) : null

    return (
      <div className="flex items-center">
        {manageTracksBtn}
        {fullPathBtn}
      </div>
    )
  }, [userIsAdmin, showFullPath, handleToggleFullPath, t, user.permissions?.update, libraryItem.id, libraryItem.libraryId])

  if (tracksWithAudioFile.length === 0) {
    return null
  }

  return (
    <CollapsibleSection
      title={t('LabelStatsAudioTracks')}
      count={tracksWithAudioFile.length}
      expanded={expanded}
      onExpandedChange={setExpanded}
      keepOpen={keepOpen}
      headerActions={headerActions}
      className={className}
    >
      <DataTable data={tracksWithAudioFile} columns={columns} getRowKey={(row) => row.index} />
    </CollapsibleSection>
  )
}
