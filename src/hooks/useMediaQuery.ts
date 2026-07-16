'use client'

import { useSyncExternalStore } from 'react'

/** Touch-first UIs: no hover and/or coarse primary pointer. */
export const COARSE_POINTER_MEDIA_QUERY = '(hover: none), (pointer: coarse)'

/** Primary input supports hover (e.g. mouse / trackpad). */
export const HOVER_CAPABLE_MEDIA_QUERY = '(hover: hover)'

/** Tailwind `lg` breakpoint (desktop player layout) */
export const LG_MEDIA_QUERY = '(min-width: 1024px)'

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
export function useMediaQuery(query: string, serverSnapshot = false): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => serverSnapshot
  )
}

/** True on touch-first devices (phones, most tablets). */
export function useCoarsePointer(): boolean {
  return useMediaQuery(COARSE_POINTER_MEDIA_QUERY, false)
}

/**
 * True when the primary input can hover (e.g. mouse / trackpad). False on touch-first UIs
 * where `(hover: hover)` does not match.
 */
export function usePrimaryInputCanHover(): boolean {
  return useMediaQuery(HOVER_CAPABLE_MEDIA_QUERY, true)
}

/** True at Tailwind `lg` and above (desktop player layout) */
export function useIsLgViewport(): boolean {
  return useMediaQuery(LG_MEDIA_QUERY, false)
}
