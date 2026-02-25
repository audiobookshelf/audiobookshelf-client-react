'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import DataTable from '@/components/ui/DataTable'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { AudioFile, BookLibraryItem, LibraryFile, PodcastLibraryItem, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface LibraryFileWithAudio extends LibraryFile {
  audioFile?: AudioFile
}

interface LibraryFilesTableProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  user: User
  keepOpen?: boolean
  inModal?: boolean
  expanded?: boolean
}

export default function LibraryFilesTable({ libraryItem, user, keepOpen = false, inModal = false, expanded: expandedProp = false }: LibraryFilesTableProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [, startDeleteTransition] = useTransition()
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<LibraryFileWithAudio | null>(null)
  const [audioFileToShow, setAudioFileToShow] = useState<AudioFile | null>(null)

  const userCanDownload = useMemo(() => user.permissions?.download || false, [user.permissions])
  const userCanDelete = useMemo(() => user.permissions?.delete || false, [user.permissions])
  const userIsAdmin = useMemo(() => user.type === 'root' || user.type === 'admin', [user.type])

  const files = useMemo<LibraryFile[]>(() => libraryItem.libraryFiles || [], [libraryItem.libraryFiles])

  const audioFiles = useMemo<AudioFile[]>(() => {
    if (libraryItem.mediaType === 'podcast') {
      return ((libraryItem as PodcastLibraryItem).media?.episodes?.map((ep) => ep.audioFile).filter((af) => af) as AudioFile[]) || []
    }
    return (libraryItem as BookLibraryItem).media?.audioFiles || []
  }, [libraryItem])

  const filesWithAudioFile = useMemo<LibraryFileWithAudio[]>(() => {
    return files.map((file) => {
      const fileWithAudio: LibraryFileWithAudio = { ...file }
      if (file.fileType === 'audio') {
        fileWithAudio.audioFile = audioFiles.find((af) => af.ino === file.ino)
      }
      return fileWithAudio
    })
  }, [files, audioFiles])

  // Load showFullPath preference from localStorage on mount
  useEffect(() => {
    if (userIsAdmin) {
      const stored = localStorage.getItem('showFullPath')
      setShowFullPath(stored === '1')
    }
  }, [userIsAdmin])

  // Sync expanded state with props (keepOpen takes precedence)
  useEffect(() => {
    setExpanded(keepOpen || expandedProp)
  }, [keepOpen, expandedProp])

  const toggleFullPath = useCallback(() => {
    setShowFullPath((prev) => {
      const newValue = !prev
      localStorage.setItem('showFullPath', newValue ? '1' : '0')
      return newValue
    })
  }, [])

  const handleDeleteFile = useCallback((file: LibraryFileWithAudio) => {
    setFileToDelete(file)
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
  }, [fileToDelete, libraryItem.id, startDeleteTransition, showToast, t])

  const handleShowMore = useCallback((audioFile: AudioFile) => {
    setAudioFileToShow(audioFile)
  }, [])

  const handleDownload = useCallback(
    (file: LibraryFileWithAudio) => {
      const downloadUrl = `/internal-api/items/${libraryItem.id}/file/${file.ino}/download`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.metadata.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [libraryItem.id]
  )

  // Minimum widths for columns (in pixels)
  // Actions: min-w-10 = 40px (w-10 = 2.5rem = 40px)
  // Size: min-w-12 = 48px (w-12 = 3rem = 48px)
  // Type: min-w-12 = 48px (w-12 = 3rem = 48px)
  // Path: flexible, can wrap
  const MIN_ACTIONS_WIDTH = 44
  const MIN_SIZE_WIDTH = 80
  const MIN_TYPE_WIDTH = 72
  const TABLE_BORDER = 2
  const PATH_MIN_WIDTH = 300

  // Calculate minTableWidth for columns
  // Path is always shown (base)
  const BASE_WIDTH = PATH_MIN_WIDTH + TABLE_BORDER + MIN_ACTIONS_WIDTH

  // Size requires base + size width
  const SIZE_MIN_TABLE_WIDTH = BASE_WIDTH + MIN_SIZE_WIDTH

  // Type requires base + size width + type width
  const TYPE_MIN_TABLE_WIDTH = SIZE_MIN_TABLE_WIDTH + MIN_TYPE_WIDTH

  const columns = useMemo(
    () => [
      {
        label: t('LabelPath'),
        accessor: (row: LibraryFileWithAudio) => <span className="break-all">{showFullPath ? row.metadata.path : row.metadata.relPath}</span>,
        headerClassName: 'text-start px-2 md:px-4 min-w-[300px]',
        cellClassName: 'text-start px-2 md:px-4 py-1 align-middle'
      },
      {
        label: t('LabelSize'),
        accessor: (row: LibraryFileWithAudio) => bytesPretty(row.metadata.size),
        headerClassName: 'text-start w-24 min-w-20 px-2',
        cellClassName: 'text-start py-1 text-xs md:text-sm whitespace-nowrap px-2 align-middle',
        minTableWidth: SIZE_MIN_TABLE_WIDTH
      },
      {
        label: t('LabelType'),
        accessor: (row: LibraryFileWithAudio) => (
          <div className="flex items-center">
            <p className="truncate">{row.fileType}</p>
          </div>
        ),
        headerClassName: 'text-start w-24 min-w-18 px-2',
        cellClassName: 'text-start text-xs py-1 whitespace-nowrap px-2 align-middle',
        minTableWidth: TYPE_MIN_TABLE_WIDTH
      },
      {
        label: '',
        accessor: (row: LibraryFileWithAudio) => {
          const items: ContextMenuDropdownItem[] = []
          if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
          if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })
          if (userIsAdmin && row.audioFile && !inModal) items.push({ text: t('LabelMoreInfo'), action: 'more' })

          if (items.length === 0) return null

          return (
            <ContextMenuDropdown
              items={items}
              autoWidth
              size="small"
              borderless
              className="h-6 w-6 md:h-7 md:w-7"
              onAction={({ action }) => {
                if (action === 'delete') handleDeleteFile(row)
                else if (action === 'download') handleDownload(row)
                else if (action === 'more' && row.audioFile) handleShowMore(row.audioFile)
              }}
              usePortal
            />
          )
        },
        headerClassName: 'w-16 min-w-11',
        cellClassName: 'text-center py-1 align-middle'
      }
    ],
    [
      t,
      showFullPath,
      userCanDownload,
      userCanDelete,
      userIsAdmin,
      inModal,
      handleDeleteFile,
      handleDownload,
      handleShowMore,
      SIZE_MIN_TABLE_WIDTH,
      TYPE_MIN_TABLE_WIDTH
    ]
  )

  const headerActions = useMemo(
    () =>
      userIsAdmin ? (
        <Btn
          color={showFullPath ? 'bg-button-selected-bg' : ''}
          size="small"
          className="mr-2"
          onClick={(e) => {
            e.stopPropagation()
            toggleFullPath()
          }}
        >
          {t('ButtonFullPath')}
        </Btn>
      ) : null,
    [userIsAdmin, showFullPath, toggleFullPath, t]
  )

  return (
    <>
      <CollapsibleSection
        title={t('HeaderLibraryFiles')}
        count={files.length}
        expanded={expanded}
        onExpandedChange={setExpanded}
        keepOpen={keepOpen}
        headerActions={headerActions}
      >
        <DataTable data={filesWithAudioFile} columns={columns} getRowKey={(row) => row.ino} />
      </CollapsibleSection>

      {/* Single confirmation dialog for the table */}
      <ConfirmDialog isOpen={!!fileToDelete} message={t('MessageConfirmDeleteFile')} onClose={() => setFileToDelete(null)} onConfirm={handleConfirmDelete} />

      {/* Single audio file data modal for the table */}
      <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={() => setAudioFileToShow(null)} />
    </>
  )
}
