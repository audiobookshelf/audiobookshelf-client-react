'use client'

import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import Btn from '@/components/ui/Btn'
import CollapsibleTable from '@/components/ui/CollapsibleTable'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AudioFile, BookLibraryItem, LibraryFile, PodcastLibraryItem, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import LibraryFilesTableRow from './LibraryFilesTableRow'

interface LibraryFileWithAudio extends LibraryFile {
  audioFile?: AudioFile
}

interface LibraryFilesTableProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  user: User
  keepOpen?: boolean
  inModal?: boolean
}

export default function LibraryFilesTable({ libraryItem, user, keepOpen = false, inModal = false }: LibraryFilesTableProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [expanded, setExpanded] = useState(false)
  const [showFullPath, setShowFullPath] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<LibraryFileWithAudio | null>(null)
  const [audioFileToShow, setAudioFileToShow] = useState<AudioFile | null>(null)

  const userCanDownload = useMemo(() => user.permissions?.download || false, [user.permissions])
  const userCanDelete = useMemo(() => user.permissions?.delete || false, [user.permissions])
  const userIsAdmin = useMemo(() => user.type === 'root' || user.type === 'admin', [user.type])

  const files = useMemo<LibraryFile[]>(() => libraryItem.libraryFiles || [], [libraryItem.libraryFiles])

  const audioFiles = useMemo<AudioFile[]>(() => {
    if (libraryItem.mediaType === 'podcast') {
      return ((libraryItem as PodcastLibraryItem).media?.episodes.map((ep) => ep.audioFile).filter((af) => af) as AudioFile[]) || []
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

  // Initialize expanded state
  useEffect(() => {
    setExpanded(keepOpen)
  }, [keepOpen])

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

  const handleConfirmDelete = useCallback(async () => {
    if (!fileToDelete) return

    try {
      const response = await fetch(`/api/items/${libraryItem.id}/file/${fileToDelete.ino}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      showToast(t('ToastDeleteFileSuccess'), { type: 'success' })
      // TODO: Refresh library item data
    } catch (error) {
      console.error('Failed to delete file', error)
      showToast(t('ToastDeleteFileFailed'), { type: 'error' })
    } finally {
      setFileToDelete(null)
    }
  }, [fileToDelete, libraryItem.id, showToast, t])

  const handleShowMore = useCallback((audioFile: AudioFile) => {
    setAudioFileToShow(audioFile)
  }, [])

  const showActionsColumn = userCanDelete || userCanDownload || (userIsAdmin && audioFiles.length > 0 && !inModal)

  const tableHeaders = useMemo(
    () => [
      { label: t('LabelPath'), className: 'px-4' },
      { label: t('LabelSize'), className: 'w-24 min-w-24' },
      { label: t('LabelType'), className: 'w-24' },
      ...(showActionsColumn ? [{ label: '', className: 'w-16' }] : [])
    ],
    [t, showActionsColumn]
  )

  const headerActions = useMemo(
    () =>
      userIsAdmin ? (
        <Btn
          color={showFullPath ? 'bg-gray-600' : 'bg-primary'}
          size="small"
          className="mr-2 hidden md:block"
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
      <CollapsibleTable
        title={t('HeaderLibraryFiles')}
        count={files.length}
        expanded={expanded}
        onExpandedChange={setExpanded}
        keepOpen={keepOpen}
        headerActions={headerActions}
        tableHeaders={tableHeaders}
      >
        {filesWithAudioFile.map((file) => (
          <LibraryFilesTableRow
            key={file.ino}
            file={file}
            libraryItemId={libraryItem.id}
            showFullPath={showFullPath}
            user={user}
            inModal={inModal}
            onDelete={handleDeleteFile}
            onShowMore={handleShowMore}
          />
        ))}
      </CollapsibleTable>

      {/* Single confirmation dialog for the table */}
      <ConfirmDialog isOpen={!!fileToDelete} message={t('MessageConfirmDeleteFile')} onClose={() => setFileToDelete(null)} onConfirm={handleConfirmDelete} />

      {/* Single audio file data modal for the table */}
      <AudioFileDataModal isOpen={!!audioFileToShow} audioFile={audioFileToShow} libraryItemId={libraryItem.id} onClose={() => setAudioFileToShow(null)} />
    </>
  )
}
