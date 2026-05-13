'use client'

import {
  MEDIA_OVERLAY_ICON_POSITION_CLASSES,
  MediaOverlayIconBtnSurface,
  type MediaOverlayIconPosition
} from '@/components/widgets/media-card/MediaOverlayIconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import type { HTMLAttributes, MouseEvent, Ref } from 'react'

/** ~44px minimum hit area on touch / coarse pointers (WCAG); mouse keeps compact layout via overlay `w-auto`. */
const COARSE_POINTER_MIN_TOUCH = '[@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px] [@media(pointer:coarse)]:shrink-0'

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
        'pointer-events-auto absolute z-40 touch-none',
        MEDIA_OVERLAY_ICON_POSITION_CLASSES[position],
        typeof activatorClassName === 'string' ? activatorClassName : undefined
      )}
    >
      <MediaOverlayIconBtnSurface
        icon={icon}
        ariaLabel={ariaLabel}
        iconBtnSize="medium"
        onClick={stopOverlayClick}
        className={mergeClasses(COARSE_POINTER_MIN_TOUCH, 'cursor-grab active:cursor-grabbing', className)}
      />
    </div>
  )
}
