'use client'

import { useSyncExternalStore } from 'react'

const MEDIA_QUERIES = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',

  'max-sm': '(max-width: 639px)',
  'max-md': '(max-width: 767px)',
  'max-lg': '(max-width: 1023px)',
  'max-xl': '(max-width: 1279px)',
  'max-2xl': '(max-width: 1535px)',

  /** Touch-first UIs: no hover and/or coarse primary pointer. */
  'coarse-pointer': '(hover: none), (pointer: coarse)',
  /** Primary input supports hover (e.g. mouse / trackpad). */
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

/** True on touch-first devices (phones, most tablets). */
export function useCoarsePointer(): boolean {
  return useMediaQuery('coarse-pointer', false)
}

/**
 * True when the primary input can hover (e.g. mouse / trackpad). False on touch-first UIs
 * where `(hover: hover)` does not match.
 */
export function usePrimaryInputCanHover(): boolean {
  return useMediaQuery('hover', true)
}

/** True at Tailwind `lg` and above (desktop player layout) */
export function useIsLgViewport(): boolean {
  return useMediaQuery('lg', false)
}
