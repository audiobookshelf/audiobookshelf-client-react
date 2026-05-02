'use client'

import { ENTITY_CONFIGS } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { toggleFinishedAction } from '@/app/actions/mediaActions'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { computeProgress } from '@/lib/mediaProgress'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookshelfEntity, BookshelfView, LibraryItem, MediaProgress } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'

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
  showDragHandle
}: CollectionBookCardShellProps) {
  const t = useTypeSafeTranslations()
  const router = useRouter()
  const { showToast } = useGlobalToast()
  const [, startTransition] = useTransition()
  const [processingFinished, setProcessingFinished] = useState(false)
  const [confirmFinished, setConfirmFinished] = useState<{ open: boolean } | null>(null)

  const media = libraryItem.media
  const mediaItemId = media && 'id' in media ? media.id : undefined
  const entityProgress = mediaItemId ? mediaItemProgressMap.get(mediaItemId) : undefined

  const { percent: userProgressPercent, isFinished: itemIsFinished } = useMemo(
    () => computeProgress({ progress: entityProgress, useSeriesProgress: false }),
    [entityProgress]
  )

  const title = useMemo(() => {
    const md = media && 'metadata' in media ? media.metadata : null
    if (md && typeof md === 'object' && md && 'title' in md) {
      return String((md as { title?: string }).title || '')
    }
    return ''
  }, [media])

  const runToggleFinished = useCallback(
    (confirmed: boolean) => {
      if (!itemIsFinished && userProgressPercent > 0 && !confirmed) {
        setConfirmFinished({ open: true })
        return
      }

      startTransition(async () => {
        try {
          setProcessingFinished(true)
          await toggleFinishedAction(libraryItem.id, { isFinished: !itemIsFinished })
          router.refresh()
        } catch (error) {
          console.error('Failed to toggle finished', error)
          showToast(!itemIsFinished ? t('ToastItemMarkedAsFinishedFailed') : t('ToastItemMarkedAsNotFinishedFailed'), { type: 'error' })
        } finally {
          setProcessingFinished(false)
          setConfirmFinished(null)
        }
      })
    },
    [itemIsFinished, libraryItem.id, router, showToast, t, userProgressPercent]
  )

  return (
    <>
      <div
        className={mergeClasses('relative shrink-0', showDragHandle && 'touch-none')}
        style={{ width: `${cardWidth}px` }}
      >
        <div className="relative z-0 min-w-0" style={{ width: `${cardWidth}px` }}>
          <itemsConfig.CardComponent
            entity={libraryItem}
            bookshelfView={bookshelfView}
            width={cardWidth}
            libraryId={libraryId}
            showSubtitles={showSubtitles}
            orderBy="media.duration"
            seriesSortBy={seriesSortBy}
            mediaItemProgressMap={mediaItemProgressMap}
            shelfEntities={shelfEntities}
            entityIndex={entityIndex}
            collectionMarkFinished={{
              isRead: itemIsFinished,
              disabled: processingFinished,
              onToggle: () => runToggleFinished(false)
            }}
          />
        </div>

        {showDragHandle && (
          <span className="pointer-events-auto absolute start-0 top-[38%] z-50 inline-flex -translate-y-1/2">
            <div
              className="drag-handle text-foreground-muted hover:text-foreground flex h-8 w-7 cursor-grab items-center justify-center rounded-sm bg-black/45 active:cursor-grabbing md:h-9 md:w-8"
              aria-label={t('TooltipCollectionDragHandle')}
            >
              <span className="material-symbols text-lg md:text-xl">menu</span>
            </div>
          </span>
        )}
      </div>

      {confirmFinished?.open && (
        <ConfirmDialog
          isOpen
          message={t('MessageConfirmMarkItemFinished', { 0: title })}
          yesButtonText={t('ButtonYes')}
          yesButtonClassName="bg-success"
          onClose={() => setConfirmFinished(null)}
          onConfirm={() => {
            setConfirmFinished(null)
            runToggleFinished(true)
          }}
        />
      )}
    </>
  )
}
