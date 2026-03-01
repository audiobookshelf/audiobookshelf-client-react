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
        headerClassName: 'text-start px-2 min-w-[200px]',
        cellClassName: 'text-start px-2 py-1 align-middle'
      },
      {
        label: t('LabelCodec'),
        accessor: (row: TrackWithAudioFile) => row.audioFile?.codec || '',
        headerClassName: 'text-start w-20 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        hiddenBelow: 'lg' as const
      },
      {
        label: t('LabelBitrate'),
        accessor: (row: TrackWithAudioFile) => (row.audioFile?.bitRate ? bytesPretty(row.audioFile.bitRate, 0) : ''),
        headerClassName: 'text-start w-24 px-2 min-w-24',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        hiddenBelow: 'lg' as const
      },
      {
        label: t('LabelSize'),
        accessor: (row: TrackWithAudioFile) => bytesPretty(row.metadata.size),
        headerClassName: 'text-start w-24 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        hiddenBelow: 'md' as const
      },
      {
        label: t('LabelDuration'),
        accessor: (row: TrackWithAudioFile) => secondsToTimestamp(row.duration),
        headerClassName: 'text-start w-24 px-2 min-w-20',
        cellClassName: 'text-start px-2 py-1 text-sm align-middle',
        hiddenBelow: 'sm' as const
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
                  const url = `/api/items/${libraryItem.id}/file/${row.audioFile?.ino}/download`
                  window.open(url, '_blank')
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
