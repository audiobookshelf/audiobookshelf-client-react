'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { type BookshelfEntity, type BookshelfView, type LibraryItem, type MediaProgress, isBookMedia } from '@/types/api'
import { type HTMLAttributes, type Ref } from 'react'
import CollectionBookCardDragHandle from './CollectionBookCardDragHandle'

const itemsConfig = ENTITY_CONFIGS.items

export interface CollectionBookCardShellProps {
  libraryItem: LibraryItem
  cardWidth: number
  libraryId: string
  bookshelfView: BookshelfView
  showSubtitles: boolean
  seriesSortBy: string
  mediaItemProgressMap: Map<string, MediaProgress>
  shelfEntities: (BookshelfEntity | null)[]
  entityIndex: number
  showDragHandle: boolean
  /** While dragging, the overlay card keeps the handle visible (no card hover). */
  dragHandleAlwaysVisible?: boolean
  /** dnd-kit `setActivatorNodeRef` callback ref for the drag handle, when sortable. */
  dragHandleRef?: Ref<HTMLDivElement>
  /** Spread of dnd-kit `attributes` + `listeners` onto the drag handle. */
  dragHandleProps?: HTMLAttributes<HTMLDivElement>
}

export default function CollectionBookCardShell({
  libraryItem,
  cardWidth,
  libraryId,
  bookshelfView,
  showSubtitles,
  seriesSortBy,
  mediaItemProgressMap,
  shelfEntities,
  entityIndex,
  showDragHandle,
  dragHandleAlwaysVisible = false,
  dragHandleRef,
  dragHandleProps
}: CollectionBookCardShellProps) {
  const t = useTypeSafeTranslations()
  const media = libraryItem.media
  // Match item page / server shape: ebooks often have `ebookFile` without top-level `ebookFormat`.
  const isEbook =
    isBookMedia(media) && (!!media.ebookFormat || !!media.ebookFile)
  const orderBy = isEbook ? undefined : 'media.duration'

  return (
    <div className="group relative shrink-0" style={{ width: `${cardWidth}px` }}>
      <div className="relative z-0 min-w-0" style={{ width: `${cardWidth}px` }}>
        <itemsConfig.CardComponent
          entity={libraryItem}
          bookshelfView={bookshelfView}
          width={cardWidth}
          libraryId={libraryId}
          showSubtitles={showSubtitles}
          orderBy={orderBy}
          seriesSortBy={seriesSortBy}
          mediaItemProgressMap={mediaItemProgressMap}
          shelfEntities={shelfEntities}
          entityIndex={entityIndex}
        />
      </div>

      {showDragHandle && (
        <CollectionBookCardDragHandle
          activatorRef={dragHandleRef}
          activatorProps={dragHandleProps}
          ariaLabel={t('TooltipCollectionDragHandle')}
          alwaysVisible={dragHandleAlwaysVisible}
        />
      )}
    </div>
  )
}
