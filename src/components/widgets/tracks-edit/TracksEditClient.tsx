'use client'

import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import TracksEditToolbar, { TracksEditActions } from '@/components/widgets/tracks-edit/TracksEditToolbar'
import TracksList from '@/components/widgets/tracks-edit/TracksList'
import { getTracksListColumnVisibility } from '@/components/widgets/tracks-edit/tracksListColumns'
import { useMediaContext } from '@/contexts/MediaContext'
import { useTrackEditor } from '@/hooks/useTrackEditor'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookLibraryItem } from '@/types/api'
import Link from 'next/link'
import { useMemo, useState } from 'react'

interface TracksEditClientProps {
  libraryItem: BookLibraryItem
}

export default function TracksEditClient({ libraryItem: initialLibraryItem }: TracksEditClientProps) {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem } = useMediaContext()
  const isStreaming = streamLibraryItem?.id === initialLibraryItem.id
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const editor = useTrackEditor({ initialLibraryItem })
  const columnVisibility = useMemo(() => getTracksListColumnVisibility(editor.files), [editor.files])

  return (
    <div className={mergeClasses('bg-bg page flex h-full min-h-0 flex-col overflow-hidden', isStreaming && 'streaming')}>
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-8">
        <div className="mb-4 flex shrink-0 flex-col gap-3 md:pt-2">
          <Link
            href={`/library/${editor.libraryItem.libraryId}/item/${editor.libraryItem.id}`}
            className="min-w-0 hover:underline"
          >
            <h1 className="text-lg lg:text-xl">{editor.title}</h1>
          </Link>

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
          reserveSpace={false}
          hasChanges={editor.hasChanges}
          isPending={editor.isPending}
          onReset={() => setShowResetConfirm(true)}
          onSave={editor.handleSave}
        />
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
    </div>
  )
}
