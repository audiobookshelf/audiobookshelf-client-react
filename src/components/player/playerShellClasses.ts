import { mergeClasses } from '@/lib/merge-classes'

export type PlayerShellVariant = 'mini' | 'fullscreen' | 'landscape'

const SHELL_MINI =
  'inset-x-0 bottom-0 z-50 h-(--player-mini-h) cursor-pointer ' +
  'grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[var(--cover-h-mini)_var(--mini-track-stack)] ' +
  'content-start items-center gap-y-(--mini-pad) pt-(--mini-pad) ps-(--mini-ps) pe-(--mini-pe) pb-(--mini-pb) ' +
  'lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
const LEAD_MINI = 'col-start-1 row-start-1 flex min-w-0 items-center justify-start gap-(--mini-title-gap)'
const END_MINI = 'col-start-3 row-start-1 hidden min-w-0 self-stretch lg:grid'
const SHELL_FS = 'fullscreen inset-0 z-90 flex h-dvh max-h-dvh min-h-dvh flex-col overscroll-none pt-(--fs-pt) ps-(--fs-ps) pe-(--fs-pe) pb-(--fs-pb)'
const SHELL_LANDSCAPE = 'grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] items-center gap-x-(--landscape-pad)'

const BODY_FS = 'grid min-h-0 w-full min-w-0 flex-auto grid-rows-[minmax(0,1fr)_auto] items-center gap-(--fs-gap)'
const BODY_LANDSCAPE = 'contents'

const COLUMN_FS = 'row-start-2 flex w-full min-w-0 flex-none flex-col self-end gap-(--fs-gap) lg:items-center'
/* Do not flex-shrink sections — escalate density instead of squashing title/metadata. */
const COLUMN_LANDSCAPE =
  'col-start-2 row-start-2 max-h-full min-h-0 w-full min-w-(--landscape-col) max-w-full justify-start self-center justify-self-stretch overflow-hidden *:min-w-0 *:shrink-0'

/* Sticks 0.5rem further out than the body so the buttons stay on the outer insets. */
const HEADER_FS = 'z-4 flex h-(--fs-header-h) shrink-0 items-center justify-between -ms-(--fs-header-outset) -me-(--fs-header-outset)'
const HEADER_LANDSCAPE = 'col-span-2 row-start-1'
const CLOSE_MINI = 'z-4 col-start-1 row-start-1 self-start justify-self-end'
const HEADER_BUTTON_FS = 'inline-flex h-11 min-h-11 w-11 min-w-11 items-center justify-center p-0'
const COLLAPSE_ICON_FS = 'text-3xl leading-none'
const CLOSE_ICON_FS = 'text-2xl leading-none'

const TRACK_STACK = 'flex flex-col'
const TRACK_STACK_MINI = 'z-2 col-span-full row-start-2 min-w-0 self-start'
/* Keep chapter timestamps grouped with the chapter slider, not the book track. */
const TRACK_STACK_FS = 'static inset-auto bottom-auto w-full gap-4 lg:w-3/4 lg:max-w-3xl'
const TRACK_MINI = 'text-xs lg:text-sm'
const TRACK_FS = 'text-sm'
const TRACK_BOOK = 'max-h-32 overflow-hidden opacity-100 visible pointer-events-auto'

const TRANSPORT = 'flex items-center'
const TRANSPORT_MINI = 'z-2 col-start-2 row-start-1 w-max justify-self-end lg:justify-self-center'
const TRANSPORT_FS = 'static inset-auto top-auto bottom-auto h-auto w-full justify-center pe-0 opacity-100 visible pointer-events-auto'

const TOOLBAR = 'flex'
/* Toolbar spans the shell width and sits above the cover — pass clicks through except on controls. */
const TOOLBAR_MINI = 'col-start-1 row-start-1 self-center justify-self-end items-center justify-end lg:pe-(--mini-toolbar-pe)'
const TOOLBAR_FS = 'static z-6 inset-auto bottom-auto h-auto w-full items-center justify-center pe-0 opacity-100 visible pointer-events-auto'

const SHELL_ROOT = 'player-shell bg-primary shadow-media-player fixed isolate w-full touch-none overflow-hidden'

/** Landscape is the fullscreen classes plus the compact-landscape placement. */
function slotClass(layout: PlayerShellVariant, mini: string, fullscreen: string, landscape = '') {
  if (layout === 'mini') return mini
  if (layout === 'landscape') return mergeClasses(fullscreen, landscape)
  return fullscreen
}

export function playerShellVariant(isPlayerFullscreen: boolean, isLandscapeCompact: boolean): PlayerShellVariant {
  if (!isPlayerFullscreen) return 'mini'
  if (isLandscapeCompact) return 'landscape'
  return 'fullscreen'
}

export function playerShellClass(layout: PlayerShellVariant) {
  return mergeClasses(SHELL_ROOT, slotClass(layout, SHELL_MINI, SHELL_FS, SHELL_LANDSCAPE))
}

export function playerHeaderClass(layout: PlayerShellVariant) {
  return slotClass(layout, '', HEADER_FS, HEADER_LANDSCAPE)
}

export function playerBodyClass(layout: PlayerShellVariant) {
  return slotClass(layout, 'contents', BODY_FS, BODY_LANDSCAPE)
}

export function playerLeadClass(layout: PlayerShellVariant) {
  return slotClass(layout, LEAD_MINI, 'contents')
}

export function playerRightColumnClass(layout: PlayerShellVariant) {
  return mergeClasses('player-right-column', slotClass(layout, 'contents', COLUMN_FS, COLUMN_LANDSCAPE))
}

export function playerEndSlotClass(layout: PlayerShellVariant) {
  return slotClass(layout, END_MINI, 'contents')
}

export function playerTrackStackClass(layout: PlayerShellVariant, showBookTrack: boolean) {
  return mergeClasses('player-track-stack', TRACK_STACK, slotClass(layout, TRACK_STACK_MINI, TRACK_STACK_FS), showBookTrack && 'player-track-stack--dual')
}

export function playerPrimaryTrackClass(layout: PlayerShellVariant) {
  return mergeClasses('player-track player-track-primary', slotClass(layout, TRACK_MINI, TRACK_FS))
}

export function playerBookTrackClass() {
  return mergeClasses('player-track player-track-book', TRACK_FS, TRACK_BOOK)
}

export function playerTransportSlotClass(layout: PlayerShellVariant) {
  return mergeClasses('player-transport-slot', TRANSPORT, slotClass(layout, TRANSPORT_MINI, TRANSPORT_FS))
}

export function playerToolbarSlotClass(layout: PlayerShellVariant) {
  return mergeClasses('player-toolbar-slot', TOOLBAR, slotClass(layout, TOOLBAR_MINI, TOOLBAR_FS))
}

export function playerMiniCloseClass() {
  return mergeClasses('player-header-close', CLOSE_MINI)
}

export function playerHeaderButtonClass(layout: PlayerShellVariant) {
  return layout === 'mini' ? undefined : HEADER_BUTTON_FS
}

export function playerCollapseIconClass(layout: PlayerShellVariant) {
  return layout === 'mini' ? undefined : COLLAPSE_ICON_FS
}

export function playerCloseIconClass(layout: PlayerShellVariant) {
  return layout === 'mini' ? undefined : CLOSE_ICON_FS
}
