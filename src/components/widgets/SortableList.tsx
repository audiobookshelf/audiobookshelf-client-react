'use client'

import { DND_POINTER_DRAG_HTML_CLASS } from '@/lib/dragHandleClasses'
import { mergeClasses } from '@/lib/merge-classes'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  useDndMonitor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragStartEvent,
  type KeyboardCodes,
  type Modifier
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, KeyboardEvent, KeyboardEventHandler } from 'react'
import { ReactNode, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

const VERTICAL_ARROW_CODES = new Set(['ArrowUp', 'ArrowDown'])

/** Arrow keys start keyboard reorder; Enter/Tab drop; Escape cancels — matches dnd-kit defaults minus Enter on start so Enter only commits. */
const sortableListKeyboardCodes: KeyboardCodes = {
  start: [KeyboardCode.Down, KeyboardCode.Up],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Enter, KeyboardCode.Tab]
}

interface SortableItem {
  id: string | number
}

/** Vertical list: ignore horizontal pointer delta so rows don’t shift sideways (avoids mobile horizontal scroll / “rubber band”). */
const restrictSortableListToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0
})

/** Attributes to spread on the drag handle (dnd-kit’s `DraggableAttributes` plus DOM props we set). */
export type SortableListDragHandleAttributes = DraggableAttributes & {
  style?: CSSProperties
  className?: string
}

export type SortableListDragHandleProps = {
  setActivatorNodeRef: (element: HTMLElement | null) => void
  attributes: SortableListDragHandleAttributes
  listeners: DraggableSyntheticListeners | undefined
}

/** Inert handle for `DragOverlay` clones — avoids duplicate listeners while keeping row layout. */
const sortableListOverlayDragHandleStub: SortableListDragHandleProps = {
  setActivatorNodeRef: () => {},
  attributes: {} as SortableListDragHandleAttributes,
  listeners: undefined
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onSortEnd: (sortedItems: T[]) => void
  renderItem: (item: T, index: number, dragHandle: SortableListDragHandleProps) => ReactNode
  className?: string
  itemClassName?: string
  disabled?: boolean
  /** When set (ms), animates rows sliding to new positions after programmatic reorder (e.g. column sort). */
  reorderAnimationDuration?: number
  /** When true for an item, that row is not draggable (e.g. inactive list entries). */
  isItemDisabled?: (item: T, index: number) => boolean
}

function SortableListRow<T extends SortableItem>({
  item,
  index,
  sortableDisabled,
  itemWrapperClassName,
  renderItem
}: {
  item: T
  index: number
  sortableDisabled: boolean
  itemWrapperClassName: string
  renderItem: (item: T, index: number, dragHandle: SortableListDragHandleProps) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
    disabled: sortableDisabled,
    // Snappier than dnd-kit defaults; avoid CSS `transition-*` on this node (see item wrapper) so
    // `transform` from the sensor isn’t eased separately from layout transitions.
    transition: {
      duration: 120,
      easing: 'ease-out'
    }
  })

  /** dnd-kit defers attaching the keyboard-move listener to the next task, so the arrow that *starts* drag never moves — replay it once. */
  const synthArrowMoveAfterStartRef = useRef<string | null>(null)
  const synthArrowTimeoutRef = useRef<number | null>(null)

  useDndMonitor({
    onDragStart({ active, activatorEvent }) {
      if (String(active.id) !== String(item.id)) return
      if (activatorEvent instanceof globalThis.KeyboardEvent && VERTICAL_ARROW_CODES.has(activatorEvent.code)) {
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

  const listenerRecord = listeners as Record<string, unknown> | undefined

  const handleActivatorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const dndKeyDown = listenerRecord?.onKeyDown as KeyboardEventHandler<HTMLElement> | undefined
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

  const activatorListeners = useMemo((): DraggableSyntheticListeners | undefined => {
    if (!listenerRecord?.onKeyDown) return listeners
    return { ...listenerRecord, onKeyDown: handleActivatorKeyDown } as DraggableSyntheticListeners
  }, [listeners, listenerRecord, handleActivatorKeyDown])

  // While dragging, the live preview is rendered in `<DragOverlay>` (portaled). Clearing
  // `transform` here keeps the in-list slot from following the pointer so scroll parents
  // don’t grow (transformed overflow expands scrollable area in common browsers).
  const transformString = CSS.Transform.toString(transform)
  const hasActiveTransform = Boolean(transform && (transform.x !== 0 || transform.y !== 0))
  const style = isDragging ? { transition, opacity: 0 } : { transform: transformString, transition: hasActiveTransform ? transition : undefined }

  // `touch-action: none` on the activator (same idea as `touch-none` on SortableBookshelfCard’s
  // handle) so coarse pointers don’t scroll the page instead of starting a drag.
  const fromKit = attributes as SortableListDragHandleAttributes
  const baseStyle = fromKit.style && typeof fromKit.style === 'object' ? { ...fromKit.style } : {}
  const activatorAttributes: SortableListDragHandleAttributes = {
    ...fromKit,
    style: {
      ...baseStyle,
      touchAction: 'none'
    }
  }
  const dragHandleProps: SortableListDragHandleProps = {
    setActivatorNodeRef,
    attributes: activatorAttributes,
    listeners: activatorListeners
  }

  return (
    <div ref={setNodeRef} style={style} className={itemWrapperClassName} data-flip-id={String(item.id)}>
      {renderItem(item, index, dragHandleProps)}
    </div>
  )
}

export default function SortableList<T extends SortableItem>({
  items,
  onSortEnd,
  renderItem,
  className = '',
  itemClassName = '',
  disabled = false,
  reorderAnimationDuration,
  isItemDisabled
}: SortableListProps<T>) {
  const dndContextId = useId()
  const [activeId, setActiveId] = useState<string | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const rowPositionsRef = useRef<Map<string, DOMRect>>(new Map())
  const previousOrderRef = useRef<string[]>([])
  const skipNextFlipRef = useRef(false)

  const itemsWithIds = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        id: item.id || `item-${index}`
      })) as T[],
    [items]
  )

  const itemWrapperClassName = mergeClasses(itemClassName)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: sortableListKeyboardCodes
    })
  )

  const sortableIds = useMemo(() => itemsWithIds.map((item) => String(item.id)), [itemsWithIds])

  const activeItem = useMemo(() => (activeId ? (itemsWithIds.find((item) => String(item.id) === activeId) ?? null) : null), [activeId, itemsWithIds])
  const activeIndex = useMemo(() => (activeId ? itemsWithIds.findIndex((item) => String(item.id) === activeId) : -1), [activeId, itemsWithIds])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
    document.documentElement.classList.add(DND_POINTER_DRAG_HTML_CLASS)
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    document.documentElement.classList.remove(DND_POINTER_DRAG_HTML_CLASS)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      document.documentElement.classList.remove(DND_POINTER_DRAG_HTML_CLASS)
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = itemsWithIds.findIndex((item) => String(item.id) === String(active.id))
      const newIndex = itemsWithIds.findIndex((item) => String(item.id) === String(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      skipNextFlipRef.current = true
      onSortEnd(arrayMove(itemsWithIds, oldIndex, newIndex))
    },
    [itemsWithIds, onSortEnd]
  )

  useEffect(() => {
    return () => document.documentElement.classList.remove(DND_POINTER_DRAG_HTML_CLASS)
  }, [])

  useLayoutEffect(() => {
    if (!reorderAnimationDuration) return

    const container = listContainerRef.current
    if (!container) return

    const children = Array.from(container.children) as HTMLElement[]
    const previousPositions = rowPositionsRef.current
    const currentOrder = itemsWithIds.map((item) => String(item.id))
    const orderChanged = previousOrderRef.current.length !== currentOrder.length || previousOrderRef.current.some((id, index) => id !== currentOrder[index])
    const shouldAnimate = !skipNextFlipRef.current && orderChanged
    skipNextFlipRef.current = false
    previousOrderRef.current = currentOrder

    if (shouldAnimate) {
      for (const child of children) {
        const id = child.dataset.flipId
        if (!id) continue

        const previousRect = previousPositions.get(id)
        const nextRect = child.getBoundingClientRect()
        if (!previousRect) continue

        const deltaY = previousRect.top - nextRect.top
        if (Math.abs(deltaY) < 1) continue

        child.animate([{ transform: `translate3d(0, ${deltaY}px, 0)` }, { transform: 'translate3d(0, 0, 0)' }], {
          duration: reorderAnimationDuration,
          easing: 'ease'
        })
      }
    }

    const nextPositions = new Map<string, DOMRect>()
    for (const child of children) {
      const id = child.dataset.flipId
      if (id) nextPositions.set(id, child.getBoundingClientRect())
    }
    rowPositionsRef.current = nextPositions
  }, [itemsWithIds, reorderAnimationDuration])

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictSortableListToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div ref={listContainerRef} className={mergeClasses('max-w-full min-w-0 overflow-x-hidden', className)}>
          {itemsWithIds.map((item, index) => (
            <SortableListRow
              key={String(item.id)}
              item={item}
              index={index}
              sortableDisabled={disabled || (isItemDisabled?.(item, index) ?? false)}
              itemWrapperClassName={itemWrapperClassName}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className={mergeClasses('pointer-events-none max-w-full min-w-0', itemWrapperClassName)}>
            {renderItem(activeItem, activeIndex >= 0 ? activeIndex : 0, sortableListOverlayDragHandleStub)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
