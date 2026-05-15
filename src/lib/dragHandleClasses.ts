/**
 * Shared Tailwind class fragments for drag / reorder handles (dnd-kit activators, overlay grips, etc.).
 */

/** ~44px minimum hit area on touch / coarse pointers (WCAG); mouse keeps compact layout where `w-auto`. */
export const DRAG_HANDLE_COARSE_POINTER_MIN_TOUCH =
  '[@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px] [@media(pointer:coarse)]:shrink-0'

/** Cursor for draggable reorder handles. */
export const DRAG_HANDLE_GRAB_CURSOR = 'cursor-grab active:cursor-grabbing'

/** Prevent the browser from treating handle touches as scroll (use on activator shells; SortableList also sets `touch-action` via dnd-kit attributes). */
export const DRAG_HANDLE_TOUCH_NONE = 'touch-none'
