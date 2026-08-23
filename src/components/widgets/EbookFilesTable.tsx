'use client'

import { deleteLibraryFileAction } from '@/app/actions/audioFileActions'
import { updateEbookFileStatusAction } from '@/app/actions/ebookActions'
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
              <span className="md:hidden">{row.metadata.relPath}</span>
              <span className="hidden md:inline">{showFullPath ? row.metadata.path : row.metadata.relPath}</span>
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
        headerClassName: 'min-w-0 px-2 text-start md:px-4',
        cellClassName: 'max-w-0 min-w-0 px-2 py-1 text-start align-middle md:px-4'
      },
      {
        label: t('LabelSize'),
        accessor: (row: LibraryFile) => bytesPretty(row.metadata.size),
        headerClassName: 'w-16 min-w-16 px-1 text-start sm:w-20 sm:min-w-20 sm:px-2',
        cellClassName: 'w-16 min-w-16 whitespace-nowrap px-1 py-1 text-start text-xs align-middle sm:w-20 sm:min-w-20 sm:px-2 md:text-sm'
      },
      {
        label: (
          <span className="inline-flex items-center gap-1">
            {t('LabelRead')}
            <span className="hidden sm:inline-flex">
              <HelpTooltipIcon text={t('LabelReadEbookWithoutProgress')} size="sm" />
            </span>
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
        headerClassName: 'w-14 min-w-14 px-1 text-start sm:w-24 sm:min-w-24 sm:px-2',
        cellClassName: 'w-14 min-w-14 px-1 py-1 text-start align-middle sm:w-24 sm:min-w-24 sm:px-2'
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
              headerClassName: 'w-11 min-w-11',
              cellClassName: 'w-11 min-w-11 py-1 text-center align-middle'
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
        <SimpleDataTable data={ebookFiles} columns={columns} getRowKey={(row) => row.ino} tableClassName="table-fixed" />
      </CollapsibleSection>

      <ConfirmDialog isOpen={!!fileToDelete} message={t('MessageConfirmDeleteFile')} onClose={() => setFileToDelete(null)} onConfirm={handleConfirmDelete} />
    </>
  )
}
