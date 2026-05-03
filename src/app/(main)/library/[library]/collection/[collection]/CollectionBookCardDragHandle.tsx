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
}

const HANDLE_BASE =
  'drag-handle text-foreground-muted hover:text-foreground flex h-8 w-7 cursor-grab touch-none items-center justify-center rounded-sm bg-black/45 active:cursor-grabbing md:h-9 md:w-8'

/**
 * Collection bookshelf reorder grip: positioned on the card edge, wired as the
 * dnd-kit activator via `activatorRef` + `activatorProps`.
 */
export default function CollectionBookCardDragHandle({ activatorRef, activatorProps, ariaLabel }: CollectionBookCardDragHandleProps) {
  const { className: propsClassName, ...restActivatorProps } = activatorProps ?? {}

  return (
    <span className="pointer-events-auto absolute start-0 top-[38%] z-50 inline-flex -translate-y-1/2">
      <div
        ref={activatorRef}
        {...restActivatorProps}
        className={mergeClasses(HANDLE_BASE, propsClassName)}
        aria-label={ariaLabel}
      >
        <span className="material-symbols text-lg md:text-xl">menu</span>
      </div>
    </span>
  )
}
