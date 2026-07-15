import IconBtn from '@/components/ui/IconBtn'
import { mergeClasses } from '@/lib/merge-classes'
import type { MouseEvent } from 'react'

const OVERLAY_ICON_SHARED_CLASSES = 'transform text-gray-200 duration-150 hover:scale-125 hover:not-disabled:text-yellow-300 w-auto h-auto'

/**
 * Tight layout used by corner overlay icons (`small`). Overrides IconBtn `size` width/typography — intentional for edit/select parity.
 * Omit for `medium` / `large` so `IconBtn` size utilities apply (e.g. draggable grip).
 */
const ICON_SIZE_CLASSES = {
  small: 'text-[1em]',
  medium: 'text-[1.5em]',
  large: 'text-[2em]'
} as const

/** Shared with [`DraggableMediaOverlayIconBtn`](./DraggableMediaOverlayIconBtn.tsx) so drag wrapping uses identical placement. */
export const MEDIA_OVERLAY_ICON_POSITION_CLASSES = {
  'top-start': 'top-[0.375em] start-[0.375em]',
  'top-end': 'top-[0.375em] end-[0.375em]',
  'bottom-start': 'bottom-[0.375em] start-[0.375em]',
  'bottom-end': 'bottom-[0.375em] end-[0.375em]',
  'top-center': 'top-[0.375em] start-1/2 -translate-x-1/2'
} as const

export type MediaOverlayIconPosition = keyof typeof MEDIA_OVERLAY_ICON_POSITION_CLASSES
export type MediaOverlayIconBtnSize = keyof typeof ICON_SIZE_CLASSES

/** Overlay-styled `IconBtn` only (no absolute shell). Used by the default component and [`DraggableMediaOverlayIconBtn`](./DraggableMediaOverlayIconBtn.tsx). */
export function MediaOverlayIconBtnSurface({
  icon,
  onClick,
  ariaLabel,
  className,
  selected,
  iconBtnSize = 'small',
  tabIndex
}: {
  icon: string
  onClick: (event: MouseEvent) => void
  ariaLabel: string
  className?: string
  selected?: boolean
  iconBtnSize?: MediaOverlayIconBtnSize
  tabIndex?: number
}) {
  return (
    <IconBtn
      borderless
      size={iconBtnSize}
      className={mergeClasses(OVERLAY_ICON_SHARED_CLASSES, ICON_SIZE_CLASSES[iconBtnSize], selected && 'text-yellow-400', className)}
      onClick={onClick}
      ariaLabel={ariaLabel}
      tabIndex={tabIndex}
    >
      {icon}
    </IconBtn>
  )
}

export interface MediaOverlayIconBtnProps {
  icon: string
  onClick: (event: MouseEvent) => void
  ariaLabel: string
  position?: MediaOverlayIconPosition
  className?: string
  selected?: boolean
  cyId?: string
  tabIndex?: number
}

export default function MediaOverlayIconBtn({
  icon,
  onClick,
  ariaLabel,
  position = 'top-start',
  className,
  selected,
  cyId,
  tabIndex
}: MediaOverlayIconBtnProps) {
  return (
    <div cy-id={cyId} data-overlay-action className={mergeClasses('absolute z-40', MEDIA_OVERLAY_ICON_POSITION_CLASSES[position])}>
      <MediaOverlayIconBtnSurface icon={icon} onClick={onClick} ariaLabel={ariaLabel} className={className} selected={selected} tabIndex={tabIndex} />
    </div>
  )
}
