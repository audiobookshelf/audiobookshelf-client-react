'use client'

import { mergeClasses } from '@/lib/merge-classes'
import type { HTMLAttributes, Ref } from 'react'

export interface CollectionBookCardDragHandleProps {
  /** dnd-kit `setActivatorNodeRef` callback ref. */
  activatorRef?: Ref<HTMLDivElement>
  /** dnd-kit `attributes` + `listeners` (and any other div props). */
  activatorProps?: HTMLAttributes<HTMLDivElement>
  /** Accessible name for the grip control (e.g. from `t('TooltipCollectionDragHandle')`). */
  ariaLabel: string
  /** Drag overlay: keep handle visible without card hover. */
  alwaysVisible?: boolean
}

const HANDLE_BASE =
  'drag-handle text-foreground-muted hover:text-foreground flex h-8 w-7 cursor-grab touch-none items-center justify-center rounded-sm bg-black/45 active:cursor-grabbing md:h-9 md:w-8'

/** Desktop / mouse: hide grip until card hover or keyboard focus-visible (see card `group`). */
const FINE_POINTER_HOVER = '[@media(hover:hover)_and_(pointer:fine)]'

const HOVER_ONLY_VISIBILITY = mergeClasses(
  'opacity-100',
  `${FINE_POINTER_HOVER}:opacity-0`,
  `${FINE_POINTER_HOVER}:group-hover:opacity-100`,
  `${FINE_POINTER_HOVER}:group-has-[:focus-visible]:opacity-100`
)

/**
 * Collection bookshelf reorder grip: top-center of the card, shown on hover (fine pointer)
 * or always on coarse pointers; wired as the dnd-kit activator via `activatorRef` + `activatorProps`.
 */
export default function CollectionBookCardDragHandle({ activatorRef, activatorProps, ariaLabel, alwaysVisible = false }: CollectionBookCardDragHandleProps) {
  const { className: propsClassName, ...restActivatorProps } = activatorProps ?? {}

  return (
    <span
      className={mergeClasses(
        'pointer-events-auto absolute start-1/2 top-0 z-50 inline-flex -translate-x-1/2',
        alwaysVisible ? 'opacity-100' : HOVER_ONLY_VISIBILITY
      )}
    >
      <div ref={activatorRef} {...restActivatorProps} className={mergeClasses(HANDLE_BASE, propsClassName)} aria-label={ariaLabel}>
        <span className="material-symbols text-lg md:text-xl">menu</span>
      </div>
    </span>
  )
}
