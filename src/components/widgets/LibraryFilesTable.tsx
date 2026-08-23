'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryFileActions } from '@/hooks/useLibraryFileActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { AudioFile, BookLibraryItem, LibraryFile, PodcastLibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface LibraryFileWithAudio extends LibraryFile {
  audioFile?: AudioFile
}

interface LibraryFilesTableProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  keepOpen?: boolean
  inModal?: boolean
  expanded?: boolean
}

export default function LibraryFilesTable({ libraryItem, keepOpen = false, inModal = false, expanded: expandedProp = false }: LibraryFilesTableProps) {
  const t = useTypeSafeTranslations()
  const { userCanDelete, userCanDownload, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const [, startDeleteTransition] = useTransition()
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<LibraryFileWithAudio | null>(null)

  const { downloadFile, showMoreInfo, audioFileToShow, closeMoreInfo } = useLibraryFileActions(libraryItem.id)

  const canDownloadItem = !libraryItem.isMissing && !libraryItem.isInvalid

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
    if (userIsAdminOrUp) {
      const stored = localStorage.getItem('showFullPath')
      setShowFullPath(stored === '1')
    }
  }, [userIsAdminOrUp])

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

  const columns = useMemo(
    () => [
      {
        label: t('LabelPath'),
        accessor: (row: LibraryFileWithAudio) => (
          <>
            <span className="break-all md:hidden">{row.metadata.relPath}</span>
            <span className="hidden break-all md:inline">{showFullPath ? row.metadata.path : row.metadata.relPath}</span>
          </>
        ),
        headerClassName: 'min-w-0 px-2 text-start md:px-4',
        cellClassName: 'max-w-0 min-w-0 px-2 py-1 text-start align-middle md:px-4'
      },
      {
        label: t('LabelSize'),
        accessor: (row: LibraryFileWithAudio) => bytesPretty(row.metadata.size),
        headerClassName: 'w-16 min-w-16 px-1 text-start sm:w-20 sm:min-w-20 sm:px-2',
        cellClassName: 'w-16 min-w-16 whitespace-nowrap px-1 py-1 text-start text-xs align-middle sm:w-20 sm:min-w-20 sm:px-2 md:text-sm'
      },
      {
        label: t('LabelType'),
        accessor: (row: LibraryFileWithAudio) => (
          <div className="flex items-center">
            <p className="truncate">{row.fileType}</p>
          </div>
        ),
        headerClassName: 'w-14 min-w-14 px-1 text-start sm:w-20 sm:min-w-18 sm:px-2',
        cellClassName: 'w-14 min-w-14 whitespace-nowrap px-1 py-1 text-start text-xs align-middle sm:w-20 sm:min-w-18 sm:px-2'
      },
      {
        label: '',
        accessor: (row: LibraryFileWithAudio) => {
          const items: ContextMenuDropdownItem[] = []
          if (userCanDownload && canDownloadItem) items.push({ text: t('LabelDownload'), action: 'download' })
          if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })
          if (userIsAdminOrUp && row.audioFile && !inModal) items.push({ text: t('LabelMoreInfo'), action: 'more' })

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
                else if (action === 'download') downloadFile(row.ino, row.metadata.filename)
                else if (action === 'more' && row.audioFile) showMoreInfo(row.audioFile)
              }}
              usePortal
            />
          )
        },
        headerClassName: 'w-11 min-w-11',
        cellClassName: 'w-11 min-w-11 py-1 text-center align-middle'
      }
    ],
    [t, showFullPath, userCanDownload, canDownloadItem, userCanDelete, userIsAdminOrUp, inModal, handleDeleteFile, downloadFile, showMoreInfo]
  )

  const headerActions = useMemo(() => {
    const pathToggleLabel = showFullPath ? t('ButtonRelativePath') : t('ButtonFullPath')
    return userIsAdminOrUp ? (
      <Tooltip text={pathToggleLabel} position="top">
        <span className="me-2 hidden md:inline-flex">
          <IconBtn
            size="small"
            ariaLabel={pathToggleLabel}
            aria-pressed={showFullPath}
            className={showFullPath ? 'bg-button-selected-bg' : undefined}
            onClick={(e) => {
              e.stopPropagation()
              toggleFullPath()
            }}
          >
            {showFullPath ? 'folder_off' : 'folder'}
          </IconBtn>
        </span>
      </Tooltip>
    ) : null
  }, [userIsAdminOrUp, showFullPath, toggleFullPath, t])

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
        <SimpleDataTable data={filesWithAudioFile} columns={columns} getRowKey={(row) => row.ino} tableClassName="table-fixed" />
      </CollapsibleSection>

      {/* Single confirmation dialog for the table */}
      <ConfirmDialog isOpen={!!fileToDelete} message={t('MessageConfirmDeleteFile')} onClose={() => setFileToDelete(null)} onConfirm={handleConfirmDelete} />

      {/* Single audio file data modal for the table */}
      <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={closeMoreInfo} />
    </>
  )
}
