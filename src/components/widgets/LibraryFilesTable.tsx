'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import AudioFileDataModal from '@/components/modals/AudioFileDataModal'
import Btn from '@/components/ui/Btn'
import CollapsibleTable from '@/components/ui/CollapsibleTable'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { AudioFile, BookLibraryItem, LibraryFile, PodcastLibraryItem, User } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
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

  const showActionsColumn = userCanDelete || userCanDownload || (userIsAdmin && audioFiles.length > 0 && !inModal)

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
  // Actions: min-w-10 = 40px (w-10 = 2.5rem = 40px)
  // Size: min-w-12 = 48px (w-12 = 3rem = 48px)
  // Type: min-w-12 = 48px (w-12 = 3rem = 48px)
  // Path: flexible, can wrap
  const MIN_ACTIONS_WIDTH = 40 // min-w-10 = 2.5rem = 40px
  const MIN_SIZE_WIDTH = 48 // min-w-12 = 3rem = 48px
  const MIN_TYPE_WIDTH = 48 // min-w-12 = 3rem = 48px
  const TABLE_BORDER = 2 // 1px border on each side
  const PATH_MIN_WIDTH = 100 // Minimum width for path column to be readable

  // Calculate which columns can fit based on available width
  const { showSize, showType } = useMemo(() => {
    if (tableWidth === null) {
      // Default to showing both on first render
      return { showSize: true, showType: true }
    }

    // Always reserve space for Path (minimum) + Actions
    const reservedWidth = PATH_MIN_WIDTH + MIN_ACTIONS_WIDTH + TABLE_BORDER
    const availableWidth = tableWidth - reservedWidth

    // Determine what fits
    // If we have space for Size, add it
    const canShowSize = availableWidth >= MIN_SIZE_WIDTH
    // If we have space for both Size and Type, add Type
    const canShowType = canShowSize && availableWidth >= MIN_SIZE_WIDTH + MIN_TYPE_WIDTH
    return {
      showSize: canShowSize,
      showType: canShowType
    }
  }, [tableWidth])

  const tableHeaders = useMemo(
    () => [
      { label: t('LabelPath'), className: 'px-2 md:px-4 min-w-[100px] max-w-[100px]' },
      ...(showSize ? [{ label: t('LabelSize'), className: 'w-12 md:w-24 min-w-12 md:min-w-24' }] : []),
      ...(showType ? [{ label: t('LabelType'), className: 'w-12 md:w-24 min-w-12 md:min-w-24' }] : []),
      ...(showActionsColumn ? [{ label: '', className: 'w-10 md:w-16 min-w-10 md:min-w-16' }] : [])
    ],
    [t, showActionsColumn, showSize, showType]
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
      <CollapsibleTable
        title={t('HeaderLibraryFiles')}
        count={files.length}
        expanded={expanded}
        onExpandedChange={setExpanded}
        keepOpen={keepOpen}
        headerActions={headerActions}
        tableHeaders={tableHeaders}
        containerRef={tableContainerRef}
      >
        {filesWithAudioFile.map((file) => (
          <LibraryFilesTableRow
            key={file.ino}
            file={file}
            libraryItemId={libraryItem.id}
            showFullPath={showFullPath}
            showSize={showSize}
            showType={showType}
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
