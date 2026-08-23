'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryFileActions } from '@/hooks/useLibraryFileActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { bytesPretty } from '@/lib/string'
import { AudioFile, AudioTrack, BookLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface AudioTracksTableProps {
  libraryItem: BookLibraryItem
  keepOpen?: boolean
  expanded?: boolean
  className?: string
}

interface TrackWithAudioFile extends AudioTrack {
  audioFile?: AudioFile
}

export default function AudioTracksTable({ libraryItem, keepOpen = false, expanded: expandedProp = false, className }: AudioTracksTableProps) {
  const t = useTypeSafeTranslations()
  const { userCanUpdate, userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const [isDeleting, startDeleteTransition] = useTransition()
  const { downloadFile, showMoreInfo, audioFileToShow, closeMoreInfo } = useLibraryFileActions(libraryItem.id)
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<AudioFile | null>(null)

  // Sync expanded state with props
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  // Load showFullPath from localStorage (admin only)
  useEffect(() => {
    if (userIsAdminOrUp) {
      const saved = localStorage.getItem('showFullPath')
      setShowFullPath(saved === '1')
    }
  }, [userIsAdminOrUp])

  const handleToggleFullPath = useCallback(() => {
    setShowFullPath((prev) => {
      const newValue = !prev
      localStorage.setItem('showFullPath', newValue ? '1' : '0')
      return newValue
    })
  }, [])

  const handleDeleteFile = useCallback((audioFile: AudioFile) => {
    setFileToDelete(audioFile)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!fileToDelete) return

    startDeleteTransition(async () => {
      try {
        await deleteLibraryFileAction(libraryItem.id, fileToDelete.ino)
        showToast(t('ToastDeleteFileSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to delete file', error)
        showToast(t('ToastDeleteFileFailed'), { type: 'error' })
      } finally {
        setFileToDelete(null)
      }
    })
  }, [fileToDelete, libraryItem.id, showToast, startDeleteTransition, t])

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
        headerClassName: 'w-10 min-w-10 px-2 text-center',
        cellClassName: 'px-2 py-1 text-center align-middle',
        hiddenBelow: 'sm' as const
      },
      {
        label: t('LabelPath'),
        accessor: (row: TrackWithAudioFile) => (
          <>
            <span className="font-sans text-sm break-all md:hidden">{row.metadata.relPath}</span>
            <span className="hidden font-sans text-sm break-all md:inline">{showFullPath ? row.metadata.path : row.metadata.relPath}</span>
          </>
        ),
        headerClassName: 'min-w-0 px-2 text-start',
        cellClassName: 'max-w-0 min-w-0 px-2 py-1 text-start align-middle'
      },
      {
        label: t('LabelCodec'),
        accessor: (row: TrackWithAudioFile) => row.audioFile?.codec || '',
        headerClassName: 'w-20 min-w-20 px-2 text-start',
        cellClassName: 'px-2 py-1 text-start text-sm align-middle',
        hiddenBelow: 'lg' as const
      },
      {
        label: t('LabelBitrate'),
        accessor: (row: TrackWithAudioFile) => (row.audioFile?.bitRate ? bytesPretty(row.audioFile.bitRate, 0) : ''),
        headerClassName: 'w-20 min-w-20 px-2 text-start',
        cellClassName: 'px-2 py-1 text-start text-sm align-middle',
        hiddenBelow: 'xl' as const
      },
      {
        label: t('LabelSize'),
        accessor: (row: TrackWithAudioFile) => bytesPretty(row.metadata.size),
        headerClassName: 'w-20 min-w-20 px-2 text-start',
        cellClassName: 'px-2 py-1 text-start text-sm align-middle',
        hiddenBelow: 'md' as const
      },
      {
        label: t('LabelDuration'),
        accessor: (row: TrackWithAudioFile) => secondsToTimestamp(row.duration),
        headerClassName: 'w-20 min-w-20 px-2 text-start',
        cellClassName: 'px-2 py-1 text-start text-sm align-middle'
      },
      {
        label: '',
        accessor: (row: TrackWithAudioFile) => {
          const items: ContextMenuDropdownItem[] = []
          if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
          if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })
          if (userIsAdminOrUp && row.audioFile) items.push({ text: t('LabelMoreInfo'), action: 'more' })

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
                  downloadFile(row.ino, row.metadata.filename)
                } else if (action === 'delete') {
                  handleDeleteFile(row)
                } else if (action === 'more' && row.audioFile) {
                  showMoreInfo(row.audioFile)
                }
              }}
              usePortal
            />
          )
        },
        headerClassName: 'w-11 min-w-11',
        cellClassName: 'w-11 min-w-11 py-1 text-center align-middle'
      }
    ],
    [t, showFullPath, userCanDownload, userCanDelete, userIsAdminOrUp, handleDeleteFile, downloadFile, showMoreInfo]
  )

  const headerActions = useMemo(() => {
    const audioFileCount = libraryItem.media.audioFiles?.length ?? 0
    const tracksPath = `/library/${libraryItem.libraryId}/item/${libraryItem.id}/tracks`
    const manageTracksBtn =
      userCanUpdate && !libraryItem.isFile && audioFileCount > 1 ? (
        <Tooltip key="manage-tracks" text={t('ButtonManageTracks')} position="top">
          <span className="me-2 inline-flex">
            <IconBtn
              to={tracksPath}
              size="small"
              ariaLabel={t('ButtonManageTracks')}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              edit
            </IconBtn>
          </span>
        </Tooltip>
      ) : null

    const pathToggleLabel = showFullPath ? t('ButtonRelativePath') : t('ButtonFullPath')
    const fullPathBtn = userIsAdminOrUp ? (
      <Tooltip key="full-path" text={pathToggleLabel} position="top">
        <span className="me-2 hidden md:inline-flex">
          <IconBtn
            size="small"
            ariaLabel={pathToggleLabel}
            aria-pressed={showFullPath}
            className={showFullPath ? 'bg-button-selected-bg' : undefined}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFullPath()
            }}
          >
            {showFullPath ? 'folder_off' : 'folder'}
          </IconBtn>
        </span>
      </Tooltip>
    ) : null

    return (
      <div className="flex items-center">
        {manageTracksBtn}
        {fullPathBtn}
      </div>
    )
  }, [
    userCanUpdate,
    userIsAdminOrUp,
    showFullPath,
    handleToggleFullPath,
    t,
    libraryItem.id,
    libraryItem.libraryId,
    libraryItem.isFile,
    libraryItem.media.audioFiles
  ])

  if (tracksWithAudioFile.length === 0) {
    return null
  }

  return (
    <>
      <CollapsibleSection
        title={t('LabelStatsAudioTracks')}
        count={tracksWithAudioFile.length}
        expanded={expanded}
        onExpandedChange={setExpanded}
        keepOpen={keepOpen}
        headerActions={headerActions}
        className={className}
      >
        <SimpleDataTable data={tracksWithAudioFile} columns={columns} getRowKey={(row) => row.index} tableClassName="table-fixed" />
      </CollapsibleSection>

      <ConfirmDialog
        isOpen={!!fileToDelete}
        message={t('MessageConfirmDeleteFile')}
        processing={isDeleting}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
      <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={closeMoreInfo} />
    </>
  )
}
