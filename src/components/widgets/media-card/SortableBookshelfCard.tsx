'use client'

import { ENTITY_CONFIGS, type CardComponentProps } from '@/app/(main)/library/[library]/[entityType]/entity-config'
import { getSortableBookshelfItemOrderBy, type SortableBookshelfOverlayMode } from '@/contexts/SortableBookshelfContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { LibraryItem } from '@/types/api'
import { useDndMonitor } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useMemo, useRef, type HTMLAttributes, type KeyboardEvent, type KeyboardEventHandler, type Ref } from 'react'

const itemsConfig = ENTITY_CONFIGS.items

const ARROW_CODES = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

/**
 * Options passed from sortable bookshelf hosts into the shared items card: dnd-kit drag activator
 * wiring and optional per-card overlay mode (e.g. `DragOverlay` preview vs in-grid card).
 */
export interface SortableBookshelfCardOptions {
  ariaLabel: string
  /**
   * dnd-kit activator node: must be the focusable card root so `KeyboardSensor` can start
   * when the frame is focused (listeners stay on the drag handle for pointer).
   */
  cardActivatorRef?: Ref<HTMLDivElement | null>
  /** Merged onto {@link MediaCardFrame} root: `useSortable` `attributes` + keyboard `onKeyDown`. */
  sortableFrameProps?: HTMLAttributes<HTMLDivElement>
  /** Pointer-only subset of `useSortable` `listeners` for the drag handle. */
  dragHandlePointerProps?: Record<string, unknown>
  /**
   * When set (e.g. `drag` on the dnd-kit `DragOverlay` card), overrides shelf context `overlayMode`
   * for overlay chrome and card navigation on this card only.
   */
  overlayMode?: SortableBookshelfOverlayMode
}

type SortableBookshelfCardProps = Omit<CardComponentProps, 'entity'> & {
  libraryItem: LibraryItem
}

/**
 * Sortable wrapper that wires dnd-kit's `useSortable` to the standard items card.
 * The drag handle keeps pointer listeners (`touch-action: none`); keyboard listeners and
 * `setActivatorNodeRef` sit on the card frame so tab focus + Arrow keys work with
 * `SortableBookshelfReorderGrid`'s `KeyboardSensor`.
 *
 * While this item is the active drag, the in-grid slot is hidden via opacity so the
 * portal-rendered `<DragOverlay>` is the only visible representation — the recommended
 * pattern for sortable grids inside a scrollable parent.
 */
export default function SortableBookshelfCard({ libraryItem, ...cardProps }: SortableBookshelfCardProps) {
  const t = useTypeSafeTranslations()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: libraryItem.id })

  /** dnd-kit defers attaching the keyboard-move listener to the next task, so the arrow that *starts* drag never moves — replay it once. */
  const synthArrowMoveAfterStartRef = useRef<string | null>(null)
  const synthArrowTimeoutRef = useRef<number | null>(null)

  useDndMonitor({
    onDragStart({ active, activatorEvent }) {
      if (String(active.id) !== libraryItem.id) return
      if (activatorEvent instanceof globalThis.KeyboardEvent && ARROW_CODES.has(activatorEvent.code)) {
        synthArrowMoveAfterStartRef.current = activatorEvent.code
      }
    },
    onDragEnd() {
      if (synthArrowTimeoutRef.current != null) {
        window.clearTimeout(synthArrowTimeoutRef.current)
        synthArrowTimeoutRef.current = null
      }
      synthArrowMoveAfterStartRef.current = null
    },
    onDragCancel() {
      if (synthArrowTimeoutRef.current != null) {
        window.clearTimeout(synthArrowTimeoutRef.current)
        synthArrowTimeoutRef.current = null
      }
      synthArrowMoveAfterStartRef.current = null
    }
  })

  useEffect(() => {
    return () => {
      if (synthArrowTimeoutRef.current != null) {
        window.clearTimeout(synthArrowTimeoutRef.current)
      }
    }
  }, [])

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1
    }),
    [transform, transition, isDragging]
  )

  const listenerRecord = listeners as Record<string, unknown> | undefined
  const dragHandlePointerProps = useMemo(() => {
    if (!listenerRecord) return undefined
    const pointerOnly = { ...listenerRecord }
    delete pointerOnly.onKeyDown
    return pointerOnly
  }, [listenerRecord])

  const handleFrameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const dndKeyDown = listenerRecord?.onKeyDown as KeyboardEventHandler<HTMLDivElement> | undefined
      if (!dndKeyDown) return
      dndKeyDown(event)
      const code = synthArrowMoveAfterStartRef.current
      if (code && code === event.code) {
        synthArrowMoveAfterStartRef.current = null
        const el = event.currentTarget
        if (synthArrowTimeoutRef.current != null) {
          window.clearTimeout(synthArrowTimeoutRef.current)
        }
        synthArrowTimeoutRef.current = window.setTimeout(() => {
          synthArrowTimeoutRef.current = null
          el.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              code,
              key: event.key,
              bubbles: true,
              cancelable: true,
              view: window
            })
          )
        }, 0)
      }
    },
    [listenerRecord]
  )

  const sortableFrameProps = useMemo((): HTMLAttributes<HTMLDivElement> => {
    if (!listenerRecord?.onKeyDown) return { ...attributes }
    return { ...attributes, onKeyDown: handleFrameKeyDown }
  }, [attributes, listenerRecord, handleFrameKeyDown])

  const orderBy = useMemo(() => getSortableBookshelfItemOrderBy(libraryItem), [libraryItem])

  const sortableBookshelfCardOptions = useMemo(
    (): SortableBookshelfCardOptions => ({
      ariaLabel: t('TooltipCollectionDragHandle'),
      cardActivatorRef: setActivatorNodeRef,
      sortableFrameProps,
      dragHandlePointerProps,
      overlayMode: isDragging ? 'drag' : undefined
    }),
    [t, setActivatorNodeRef, sortableFrameProps, dragHandlePointerProps, isDragging]
  )

  return (
    <div ref={setNodeRef} style={style} className="flex justify-center overflow-visible">
      <itemsConfig.CardComponent
        {...cardProps}
        entity={libraryItem}
        orderBy={orderBy}
        isPodcastLibrary={false}
        sortableBookshelfCardOptions={sortableBookshelfCardOptions}
      />
    </div>
  )
}
