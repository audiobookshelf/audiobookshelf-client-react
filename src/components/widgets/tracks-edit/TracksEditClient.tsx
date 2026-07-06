'use client'

import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import LibraryItemSubpageHeader, { libraryItemSubpageMaxWidthClass } from '@/components/widgets/LibraryItemSubpageHeader'
import TracksEditToolbar, { TracksEditActions } from '@/components/widgets/tracks-edit/TracksEditToolbar'
import TracksList from '@/components/widgets/tracks-edit/TracksList'
import { getTracksListColumnVisibility } from '@/components/widgets/tracks-edit/tracksListColumns'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTrackEditor } from '@/hooks/useTrackEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookLibraryItem } from '@/types/api'
import { useMemo, useState } from 'react'

interface TracksEditClientProps {
  libraryItem: BookLibraryItem
}

export default function TracksEditClient({ libraryItem: initialLibraryItem }: TracksEditClientProps) {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem } = useMediaContext()
  const isStreaming = streamLibraryItem?.id === initialLibraryItem.id
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const editor = useTrackEditor({ initialLibraryItem })
  const columnVisibility = useMemo(() => getTracksListColumnVisibility(editor.files), [editor.files])

  return (
    <div className={mergeClasses('bg-bg page flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-8', isStreaming && 'streaming')}>
      <LibraryItemSubpageHeader
        libraryItem={editor.libraryItem}
        libraryId={editor.libraryItem.libraryId}
        itemId={editor.libraryItem.id}
        title={editor.title}
        onEditClick={() => setIsEditModalOpen(true)}
      />

      <div className="flex min-h-0 flex-1 justify-center">
        <div className={mergeClasses('flex min-h-0 w-full flex-col', libraryItemSubpageMaxWidthClass)}>
          <div className="mb-2 shrink-0 lg:hidden">
            <TracksEditToolbar currentSort={editor.currentSort} columnVisibility={columnVisibility} onSort={editor.handleSort} />
          </div>

          <TracksList
            files={editor.files}
            newTrackIndices={editor.newTrackIndices}
            currentSort={editor.currentSort}
            onSortEnd={editor.handleSortEnd}
            onSort={editor.handleSort}
            onIncludeToggle={editor.handleIncludeToggle}
          />

          <TracksEditActions
            className="border-border w-full shrink-0 border-t pt-3"
            hasChanges={editor.hasChanges}
            isPending={editor.isPending}
            onReset={() => setShowResetConfirm(true)}
            onSave={editor.handleSave}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        message={t('MessageResetTracklistConfirm')}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false)
          editor.handleReset()
        }}
      />

      {isEditModalOpen && <LibraryItemEditModal isOpen libraryItem={editor.libraryItem} onClose={() => setIsEditModalOpen(false)} />}
    </div>
  )
}
