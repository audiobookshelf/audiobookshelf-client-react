'use client'

import { useSyncExternalStore } from 'react'

const MEDIA_QUERIES = {
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  'max-sm': '(max-width: 639px)',
  'max-md': '(max-width: 767px)',
  'landscape-compact': '(orientation: landscape) and (max-height: 600px)',
  'coarse-pointer': '(hover: none), (pointer: coarse)',
  hover: '(hover: hover)'
} as const

type MediaQueryKey = keyof typeof MEDIA_QUERIES

function subscribeMediaQuery(query: string, onStoreChange: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

function getMediaQuerySnapshot(query: string) {
  return window.matchMedia(query).matches
}

/**
 * Subscribes to a `window.matchMedia` query. `serverSnapshot` is used for SSR and the first client paint.
 */
export function useMediaQuery(query: MediaQueryKey, serverSnapshot = false): boolean {
  const mediaQuery = MEDIA_QUERIES[query]
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(mediaQuery, onStoreChange),
    () => getMediaQuerySnapshot(mediaQuery),
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
