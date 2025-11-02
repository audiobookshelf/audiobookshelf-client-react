'use client'

import ContextMenuDropdown, { ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import TableRow from '@/components/ui/TableRow'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { bytesPretty } from '@/lib/string'
import { AudioFile, LibraryFile, User } from '@/types/api'
import { useCallback, useMemo } from 'react'

interface LibraryFileWithAudio extends LibraryFile {
  audioFile?: AudioFile
}

interface LibraryFilesTableRowProps {
  file: LibraryFileWithAudio
  libraryItemId: string
  showFullPath: boolean
  user: User
  inModal: boolean
  onDelete: (file: LibraryFileWithAudio) => void
  onShowMore: (audioFile: AudioFile) => void
}

export default function LibraryFilesTableRow({ file, libraryItemId, showFullPath, user, inModal, onDelete, onShowMore }: LibraryFilesTableRowProps) {
  const t = useTypeSafeTranslations()

  const userCanDownload = useMemo(() => user.permissions?.download || false, [user.permissions])
  const userCanDelete = useMemo(() => user.permissions?.delete || false, [user.permissions])
  const userIsAdmin = useMemo(() => user.type === 'root' || user.type === 'admin', [user.type])

  const downloadUrl = useMemo(() => `/internal-api/items/${libraryItemId}/file/${file.ino}/download`, [libraryItemId, file.ino])

  const contextMenuItems = useMemo<ContextMenuDropdownItem[]>(() => {
    const items: ContextMenuDropdownItem[] = []

    if (userCanDownload) {
      items.push({
        text: t('LabelDownload'),
        action: 'download'
      })
    }

    if (userCanDelete) {
      items.push({
        text: t('ButtonDelete'),
        action: 'delete'
      })
    }

    // Currently not showing this option in the Files tab modal
    if (userIsAdmin && file.audioFile && !inModal) {
      items.push({
        text: t('LabelMoreInfo'),
        action: 'more'
      })
    }

    return items
  }, [userCanDownload, userCanDelete, userIsAdmin, file.audioFile, inModal, t])

  const handleDownload = useCallback(() => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = file.metadata.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [downloadUrl, file.metadata.filename])

  const handleContextMenuAction = useCallback(
    ({ action }: { action: string }) => {
      if (action === 'delete') {
        onDelete(file)
      } else if (action === 'download') {
        handleDownload()
      } else if (action === 'more' && file.audioFile) {
        onShowMore(file.audioFile)
      }
    },
    [file, onDelete, handleDownload, onShowMore]
  )

  return (
    <TableRow>
      <td className="px-4 py-1">{showFullPath ? file.metadata.path : file.metadata.relPath}</td>
      <td className="py-1">{bytesPretty(file.metadata.size)}</td>
      <td className="text-xs py-1">
        <div className="flex items-center">
          <p>{file.fileType}</p>
        </div>
      </td>
      {contextMenuItems.length > 0 && (
        <td className="text-center py-1">
          <ContextMenuDropdown items={contextMenuItems} autoWidth size="small" borderless className="h-7 w-7" onAction={handleContextMenuAction} />
        </td>
      )}
    </TableRow>
  )
}
