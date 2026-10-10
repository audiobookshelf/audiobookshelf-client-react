'use client'

import { useSyncExternalStore } from 'react'

/** Theme token from src/assets/globals.css. Media queries cannot use var(), so it is read once at runtime. */
const COMPACT_LANDSCAPE_MAX_HEIGHT_VAR = '--compact-landscape-max-height'

let compactLandscapeMaxHeight = ''

/** Empty until the global stylesheet has been applied. */
function getCompactLandscapeMaxHeight(): string {
  if (!compactLandscapeMaxHeight) {
    compactLandscapeMaxHeight = getComputedStyle(document.documentElement).getPropertyValue(COMPACT_LANDSCAPE_MAX_HEIGHT_VAR).trim()
  }
  return compactLandscapeMaxHeight
}

function compactLandscapeQuery(): string {
  const maxHeight = getCompactLandscapeMaxHeight()
  // Before the stylesheet loads, no viewport counts as compact landscape (width-only, like the unstyled CSS).
  return maxHeight ? `(orientation: landscape) and (max-height: ${maxHeight})` : 'not all'
}

/**
 * Keep in sync with the sm/md overrides in src/assets/globals.css.
 * There is no `md` entry: use `!useMediaQuery('max-md')`, which is its exact complement.
 */
const MEDIA_QUERIES = {
  lg: () => '(min-width: 1024px)',
  'max-sm': () => `(max-width: 39.99rem), ${compactLandscapeQuery()}`,
  'max-md': () => `(max-width: 47.99rem), ${compactLandscapeQuery()}`,
  'landscape-compact': compactLandscapeQuery,
  'coarse-pointer': () => '(hover: none), (pointer: coarse)',
  hover: () => '(hover: hover)'
}

type MediaQueryKey = keyof typeof MEDIA_QUERIES

/** Client-only: builds the media query string for `window.matchMedia`. */
export function getMediaQuery(key: MediaQueryKey): string {
  return MEDIA_QUERIES[key]()
}

function subscribeMediaQuery(key: MediaQueryKey, onStoreChange: () => void) {
  let mq = window.matchMedia(getMediaQuery(key))
  mq.addEventListener('change', onStoreChange)

  // The theme token cannot be read until the stylesheet loads; rebuild the query once it has.
  const waitForStylesheet = !compactLandscapeMaxHeight && document.readyState !== 'complete'
  const handleLoad = () => {
    mq.removeEventListener('change', onStoreChange)
    mq = window.matchMedia(getMediaQuery(key))
    mq.addEventListener('change', onStoreChange)
    onStoreChange()
  }
  if (waitForStylesheet) window.addEventListener('load', handleLoad, { once: true })

  return () => {
    mq.removeEventListener('change', onStoreChange)
    if (waitForStylesheet) window.removeEventListener('load', handleLoad)
  }
}

function getMediaQuerySnapshot(key: MediaQueryKey) {
  return window.matchMedia(getMediaQuery(key)).matches
}

/**
 * Subscribes to a `window.matchMedia` query. `serverSnapshot` is used for SSR and the first client paint.
 */
export function useMediaQuery(query: MediaQueryKey, serverSnapshot = false): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => serverSnapshot
  )
}
/**
 * Returns true when the viewport is below the `sm` breakpoint.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('max-sm')
}

/**
 * True when the primary input can hover (e.g. mouse / trackpad). False on touch-first UIs
 * where `(hover: hover)` does not match.
 */
export function usePrimaryInputCanHover(): boolean {
  return useMediaQuery('hover', true)
}
