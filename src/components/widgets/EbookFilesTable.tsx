'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import { updateEbookFileStatusAction } from '@/app/actions/ebookActions'
import Btn from '@/components/ui/Btn'
import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import HelpTooltipIcon from '@/components/ui/HelpTooltipIcon'
import IconBtn from '@/components/ui/IconBtn'
import SimpleDataTable from '@/components/ui/SimpleDataTable'
import Tooltip from '@/components/ui/Tooltip'
import CollapsibleSection from '@/components/widgets/CollapsibleSection'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useEreader } from '@/contexts/EreaderContext'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useLibraryFileActions } from '@/hooks/useLibraryFileActions'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { BookLibraryItem, LibraryFile } from '@/types/api'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

const MIN_ACTIONS_WIDTH = 44
const MIN_SIZE_WIDTH = 80
const MIN_READ_WIDTH = 48
const TABLE_BORDER = 2
const PATH_MIN_WIDTH = 300

const BASE_WIDTH = PATH_MIN_WIDTH + TABLE_BORDER + MIN_ACTIONS_WIDTH
const SIZE_MIN_TABLE_WIDTH = BASE_WIDTH + MIN_SIZE_WIDTH
const READ_MIN_TABLE_WIDTH = SIZE_MIN_TABLE_WIDTH + MIN_READ_WIDTH

interface EbookFilesTableProps {
  libraryItem: BookLibraryItem
  keepOpen?: boolean
  expanded?: boolean
}

export default function EbookFilesTable({ libraryItem, keepOpen = false, expanded: expandedProp = false }: EbookFilesTableProps) {
  const t = useTypeSafeTranslations()
  const { library } = useLibrary()
  const { openEreader } = useEreader()
  const { userCanDelete, userCanDownload, userCanUpdate, userIsAdminOrUp } = useUser()
  const { showToast } = useGlobalToast()
  const [, startDeleteTransition] = useTransition()
  const [, startUpdateTransition] = useTransition()
  const [expanded, setExpanded] = useState(expandedProp)
  const [showFullPath, setShowFullPath] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<LibraryFile | null>(null)
  const [processingIno, setProcessingIno] = useState<string | null>(null)

  const { downloadFile } = useLibraryFileActions(libraryItem.id)

  const ebookFiles = useMemo<LibraryFile[]>(() => (libraryItem.libraryFiles || []).filter((file) => file.fileType === 'ebook'), [libraryItem.libraryFiles])

  const libraryIsAudiobooksOnly = !!library.settings?.audiobooksOnly
  const showMoreColumn = userCanDelete || userCanDownload || (userCanUpdate && !libraryIsAudiobooksOnly)

  useEffect(() => {
    if (userIsAdminOrUp) {
      const stored = localStorage.getItem('showFullPath')
      setShowFullPath(stored === '1')
    }
  }, [userIsAdminOrUp])

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

  const handleReadEbook = useCallback(
    (file: LibraryFile) => {
      const ebookFormat = file.metadata.ext.replace(/^\./, '').toLowerCase()
      openEreader({
        libraryItemId: libraryItem.id,
        title: libraryItem.media.metadata.title ?? file.metadata.filename,
        ebookFormat,
        epubsAllowScriptedContent: !!library.settings?.epubsAllowScriptedContent,
        fileId: file.ino,
        keepProgress: false
      })
    },
    [library.settings?.epubsAllowScriptedContent, libraryItem.id, libraryItem.media.metadata.title, openEreader]
  )

  const handleDeleteFile = useCallback((file: LibraryFile) => {
    setFileToDelete(file)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!fileToDelete) return

    startDeleteTransition(async () => {
      setProcessingIno(fileToDelete.ino)
      try {
        await deleteLibraryFileAction(libraryItem.id, fileToDelete.ino)
        showToast(t('ToastDeleteFileSuccess'), { type: 'success' })
      } catch (error) {
        console.error('Failed to delete file', error)
        showToast(t('ToastDeleteFileFailed'), { type: 'error' })
      } finally {
        setProcessingIno(null)
        setFileToDelete(null)
      }
    })
  }, [fileToDelete, libraryItem.id, showToast, startDeleteTransition, t])

  const handleUpdateEbookStatus = useCallback(
    (file: LibraryFile) => {
      startUpdateTransition(async () => {
        setProcessingIno(file.ino)
        try {
          await updateEbookFileStatusAction(libraryItem.id, file.ino)
          showToast(t('ToastItemUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to update ebook', error)
          showToast(t('ToastFailedToUpdate'), { type: 'error' })
        } finally {
          setProcessingIno(null)
        }
      })
    },
    [libraryItem.id, showToast, startUpdateTransition, t]
  )

  const columns = useMemo(
    () => [
      {
        label: t('LabelPath'),
        accessor: (row: LibraryFile) => {
          const isPrimary = !row.isSupplementary
          return (
            <span className="break-all">
              {showFullPath ? row.metadata.path : row.metadata.relPath}
              {isPrimary && (
                <span className="ms-1 inline-block">
                  <Tooltip text={t('LabelPrimaryEbook')} position="top">
                    <span className="material-symbols text-success align-text-bottom text-base">check_circle</span>
                  </Tooltip>
                </span>
              )}
            </span>
          )
        },
        headerClassName: 'text-start px-2 md:px-4 min-w-[300px]',
        cellClassName: 'text-start px-2 md:px-4 py-1 align-middle'
      },
      {
        label: t('LabelSize'),
        accessor: (row: LibraryFile) => bytesPretty(row.metadata.size),
        headerClassName: 'text-start w-22 min-w-20 px-2',
        cellClassName: 'text-start py-1 text-xs md:text-sm whitespace-nowrap px-2 align-middle',
        minTableWidth: SIZE_MIN_TABLE_WIDTH
      },
      {
        label: (
          <span className="inline-flex items-center gap-1">
            {t('LabelRead')}
            <HelpTooltipIcon text={t('LabelReadEbookWithoutProgress')} size="sm" />
          </span>
        ),
        accessor: (row: LibraryFile) => (
          <IconBtn
            size="small"
            outlined
            borderless
            ariaLabel={t('LabelReadEbookWithoutProgress')}
            onClick={(e) => {
              e.stopPropagation()
              handleReadEbook(row)
            }}
          >
            auto_stories
          </IconBtn>
        ),
        headerClassName: 'text-start w-24 min-w-24 px-2',
        cellClassName: 'text-start py-1 px-2 align-middle',
        minTableWidth: READ_MIN_TABLE_WIDTH
      },
      ...(showMoreColumn
        ? [
            {
              label: '',
              accessor: (row: LibraryFile) => {
                const isPrimary = !row.isSupplementary
                const items: ContextMenuDropdownItem[] = []
                if (userCanUpdate && !libraryIsAudiobooksOnly) {
                  items.push({
                    text: isPrimary ? t('LabelSetEbookAsSupplementary') : t('LabelSetEbookAsPrimary'),
                    action: 'updateStatus'
                  })
                }
                if (userCanDownload) items.push({ text: t('LabelDownload'), action: 'download' })
                if (userCanDelete) items.push({ text: t('ButtonDelete'), action: 'delete' })

                if (items.length === 0) return null

                return (
                  <ContextMenuDropdown
                    items={items}
                    autoWidth
                    size="small"
                    borderless
                    processing={processingIno === row.ino}
                    className="h-6 w-6 md:h-7 md:w-7"
                    onAction={({ action }) => {
                      if (action === 'delete') handleDeleteFile(row)
                      else if (action === 'download') downloadFile(row.ino, row.metadata.filename)
                      else if (action === 'updateStatus') handleUpdateEbookStatus(row)
                    }}
                    usePortal
                  />
                )
              },
              headerClassName: 'w-12 min-w-11',
              cellClassName: 'text-center py-1 align-middle'
            }
          ]
        : [])
    ],
    [
      t,
      showFullPath,
      showMoreColumn,
      userCanUpdate,
      userCanDownload,
      userCanDelete,
      libraryIsAudiobooksOnly,
      processingIno,
      handleReadEbook,
      handleDeleteFile,
      handleUpdateEbookStatus,
      downloadFile
    ]
  )

  const headerActions = useMemo(
    () =>
      userIsAdminOrUp ? (
        <Btn
          color={showFullPath ? 'bg-button-selected-bg' : ''}
          size="small"
          className="mr-2 hidden md:inline-flex"
          onClick={(e) => {
            e.stopPropagation()
            toggleFullPath()
          }}
        >
          {t('ButtonFullPath')}
        </Btn>
      ) : null,
    [userIsAdminOrUp, showFullPath, toggleFullPath, t]
  )

  if (ebookFiles.length === 0) {
    return null
  }

  return (
    <>
      <CollapsibleSection
        title={t('HeaderEbookFiles')}
        count={ebookFiles.length}
        expanded={expanded}
        onExpandedChange={setExpanded}
        keepOpen={keepOpen}
        headerActions={headerActions}
      >
        <SimpleDataTable data={ebookFiles} columns={columns} getRowKey={(row) => row.ino} />
      </CollapsibleSection>

      <ConfirmDialog isOpen={!!fileToDelete} message={t('MessageConfirmDeleteFile')} onClose={() => setFileToDelete(null)} onConfirm={handleConfirmDelete} />
    </>
  )
}
