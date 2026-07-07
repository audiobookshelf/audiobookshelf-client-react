'use client'

import {
  MEDIA_OVERLAY_ICON_POSITION_CLASSES,
  MediaOverlayIconBtnSurface,
  type MediaOverlayIconPosition
} from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR, DRAG_HANDLE_TOUCH_NONE } from '@/lib/dragHandleClasses'
import { mergeClasses } from '@/lib/merge-classes'
import type { HTMLAttributes, MouseEvent, Ref } from 'react'

export interface DraggableMediaOverlayIconBtnProps {
  icon: string
  ariaLabel: string
  /** dnd-kit `setActivatorNodeRef` — outer wrapper receives drag listeners (see @dnd-kit docs). */
  activatorRef?: Ref<HTMLDivElement | null>
  /** dnd-kit `attributes` + `listeners` (+ optional extra div props). */
  activatorProps?: Record<string, unknown>
  position?: MediaOverlayIconPosition
  className?: string
}

/**
 * Wraps [`MediaOverlayIconBtnSurface`](./MediaOverlayIconBtn.tsx) with a positioned layer that holds the
 * dnd-kit activator ref and sensors, without changing overlay icon styling.
 */
export default function DraggableMediaOverlayIconBtn({
  icon,
  ariaLabel,
  activatorRef,
  activatorProps,
  position = 'top-center',
  className
}: DraggableMediaOverlayIconBtnProps) {
  const { className: activatorClassName, ...restActivator } = activatorProps ?? {}

  const stopOverlayClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      ref={activatorRef}
      {...(restActivator as HTMLAttributes<HTMLDivElement>)}
      className={mergeClasses(
        'pointer-events-auto absolute z-40',
        DRAG_HANDLE_TOUCH_NONE,
        MEDIA_OVERLAY_ICON_POSITION_CLASSES[position],
        typeof activatorClassName === 'string' ? activatorClassName : undefined
      )}
    >
      <MediaOverlayIconBtnSurface
        icon={icon}
        ariaLabel={ariaLabel}
        iconBtnSize="medium"
        onClick={stopOverlayClick}
        className={mergeClasses(DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH, DRAG_HANDLE_GRAB_CURSOR, className)}
        tabIndex={-1}
      />
    </div>
  )
}
