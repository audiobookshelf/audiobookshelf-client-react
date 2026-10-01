import { mergeClasses } from '@/lib/merge-classes'

export type PlayerShellVariant = 'mini' | 'fullscreen' | 'landscape'

export interface LayoutClasses {
  root?: string
  mini?: string
  fullscreen?: string
  landscape?: string
}

/** Landscape is the fullscreen classes plus the compact-landscape placement. */
export function layoutClass(classes: LayoutClasses, layout: PlayerShellVariant) {
  if (layout === 'mini') return mergeClasses(classes.root, classes.mini)
  return mergeClasses(classes.root, classes.fullscreen, layout === 'landscape' && classes.landscape)
}

export function playerShellVariant(isPlayerFullscreen: boolean, isLandscapeCompact: boolean): PlayerShellVariant {
  if (!isPlayerFullscreen) return 'mini'
  if (isLandscapeCompact) return 'landscape'
  return 'fullscreen'
}

/** Above the fullscreen player shell (`z-90` in `SHELL.fullscreen`) so player modals/popovers stay interactive. */
export const PLAYER_OVERLAY_Z_CLASS = 'z-[100]'

export const SHELL: LayoutClasses = {
  root: 'player-shell bg-primary shadow-media-player fixed isolate w-full touch-none overflow-hidden',
  mini:
    'inset-x-0 bottom-0 z-50 h-(--player-mini-h) cursor-pointer ' +
    'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[var(--cover-h-mini)_var(--mini-track-stack)] ' +
    'content-start items-center gap-y-(--mini-pad) pt-(--mini-pad) ps-(--mini-ps) pe-(--mini-pe) pb-(--mini-pb) ' +
    'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
  fullscreen: 'fullscreen inset-x-0 top-0 z-90 flex h-dvh max-h-dvh flex-col overscroll-none pt-(--fs-pt) ps-(--fs-ps) pe-(--fs-pe) pb-(--fs-pb)',
  landscape: 'grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] items-center gap-x-(--landscape-pad)'
}

export const LEAD: LayoutClasses = {
  mini: 'col-start-1 row-start-1 flex min-w-0 items-center justify-start gap-(--mini-title-gap)',
  fullscreen: 'contents'
}

export const END: LayoutClasses = {
  mini: 'col-start-3 row-start-1 hidden min-w-0 self-stretch lg:grid',
  fullscreen: 'contents'
}

export const BODY: LayoutClasses = {
  mini: 'contents',
  fullscreen: 'grid min-h-0 w-full min-w-0 flex-auto grid-rows-[minmax(0,1fr)_auto] items-center gap-(--fs-gap)',
  landscape: 'contents'
}

export const COLUMN: LayoutClasses = {
  root: 'player-right-column',
  mini: 'contents',
  fullscreen: 'row-start-2 flex w-full min-w-0 flex-none flex-col self-end gap-(--fs-gap) lg:items-center',
  /* Do not flex-shrink sections — escalate density instead of squashing title/metadata. */
  landscape:
    'col-start-2 row-start-2 max-h-full min-h-0 w-full min-w-(--landscape-col) max-w-full justify-start self-center justify-self-stretch overflow-hidden *:min-w-0 *:shrink-0'
}

/* Sticks 0.5rem further out than the body so the buttons stay on the outer insets. */
export const HEADER: LayoutClasses = {
  fullscreen: 'z-4 flex h-(--fs-header-h) shrink-0 items-center justify-between -ms-(--fs-header-outset) -me-(--fs-header-outset)',
  landscape: 'col-span-2 row-start-1'
}

export const CLOSE: LayoutClasses = {
  root: 'player-header-close',
  mini: 'z-4 col-start-1 row-start-1 self-start justify-self-end'
}

export const HEADER_BUTTON: LayoutClasses = {
  fullscreen: 'inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center p-0'
}

export const COLLAPSE_ICON: LayoutClasses = {
  fullscreen: 'text-3xl leading-none'
}

export const CLOSE_ICON: LayoutClasses = {
  fullscreen: 'text-2xl leading-none'
}

export const TRACK_STACK: LayoutClasses = {
  root: 'flex flex-col',
  mini: 'z-2 col-span-full row-start-2 min-w-0 self-start',
  /* Keep chapter timestamps grouped with the chapter slider, not the book track. */
  fullscreen: 'static inset-auto bottom-auto w-full gap-(--fs-track-gap) lg:w-3/4 lg:max-w-3xl'
}

export const PRIMARY_TRACK: LayoutClasses = {
  root: 'player-track player-track-primary',
  mini: 'text-xs lg:text-sm',
  fullscreen: 'text-sm'
}

export const BOOK_TRACK = 'player-track player-track-book text-sm max-h-32 opacity-100 visible pointer-events-auto'

export const TRANSPORT: LayoutClasses = {
  root: 'flex items-center',
  mini: 'z-2 col-start-2 row-start-1 w-max justify-self-end lg:justify-self-center',
  fullscreen: 'static inset-auto top-auto bottom-auto h-auto w-full justify-center pe-0 opacity-100 visible pointer-events-auto'
}

/* Toolbar spans the shell width and sits above the cover — pass clicks through except on controls. */
export const TOOLBAR: LayoutClasses = {
  root: 'flex',
  mini: 'col-start-1 row-start-1 self-center justify-self-end items-center justify-end lg:pe-(--mini-toolbar-pe)',
  fullscreen: 'static z-6 inset-auto bottom-auto h-auto w-full items-center justify-center pe-0 opacity-100 visible pointer-events-auto'
}
