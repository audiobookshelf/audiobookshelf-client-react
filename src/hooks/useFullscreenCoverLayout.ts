'use client'

import {
  isDesktopViewport,
  isLandscapeCompactViewport,
  miniCoverSize,
  fitLandscapeCompactLayout,
  LANDSCAPE_COMPACT_COL_MIN_WIDTH,
  measureDesktopFullscreenContentWidth,
  type CoverSize
} from '@/lib/player/coverFit'
import { coverWidthOverHeight, fitFullscreenCoverInRemainingSpace, type FullscreenCoverChrome } from '@/lib/player/fullscreenCoverMeasure'
import { CSSProperties, RefObject, useLayoutEffect, useState } from 'react'

const FULLSCREEN_CHROME_GAP_PX = 8
const FULLSCREEN_COVER_COLUMN_GAP_PX = 8

function parseLengthPx(value: string, rootFontSize: number): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * rootFontSize
  if (trimmed.endsWith('px')) return parseFloat(trimmed)
  return parseFloat(trimmed) || 0
}

function measureChrome(shell: HTMLElement): FullscreenCoverChrome {
  const shellRect = shell.getBoundingClientRect()
  const shellStyle = getComputedStyle(shell)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const paddingTop = parseLengthPx(shellStyle.paddingTop, rootFontSize)
  const paddingBottom = parseLengthPx(shellStyle.paddingBottom, rootFontSize)
  const paddingInlineStart = parseLengthPx(shellStyle.paddingInlineStart, rootFontSize)
  const paddingInlineEnd = parseLengthPx(shellStyle.paddingInlineEnd, rootFontSize)
  const columnGap = parseLengthPx(shellStyle.columnGap, rootFontSize)

  let chromeBottom = paddingTop
  for (const selector of ['.player-chrome-start button', '.player-chrome-end button']) {
    const button = shell.querySelector(selector)
    if (button) {
      chromeBottom = Math.max(chromeBottom, button.getBoundingClientRect().bottom - shellRect.top + FULLSCREEN_CHROME_GAP_PX)
    }
  }

  return {
    contentTopPx: Math.max(chromeBottom, paddingTop),
    contentBottomPx: paddingBottom,
    paddingInlineStartPx: paddingInlineStart,
    paddingInlineEndPx: paddingInlineEnd,
    columnGapPx: columnGap
  }
}

function measureReservedBelowCover(shell: HTMLElement): number {
  const rightColumn = shell.querySelector('.player-right-column')
  if (!rightColumn) return 0

  const shellStyle = getComputedStyle(shell)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const gap = parseLengthPx(shellStyle.getPropertyValue('--player-fullscreen-section-gap') || '0.5rem', rootFontSize)
  const children = Array.from(rightColumn.children) as HTMLElement[]

  const heights = children.reduce((sum, child) => sum + child.offsetHeight, 0)
  const gaps = children.length > 1 ? gap * (children.length - 1) : 0
  return heights + gaps
}

function measureCoverNaturalSize(shell: HTMLElement): CoverSize | null {
  const img = shell.querySelector('.player-cover img')
  if (!(img instanceof HTMLImageElement) || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    return null
  }

  return { width: img.naturalWidth, height: img.naturalHeight }
}

function measurePortraitContentBlockWidth(shell: HTMLElement, isDesktop: boolean): number | undefined {
  if (!isDesktop) return undefined

  const trackStack = shell.querySelector('.player-right-column .player-track-stack')
  if (trackStack instanceof HTMLElement) {
    const width = Math.round(trackStack.getBoundingClientRect().width)
    if (width > 0) return width
  }

  const measured = measureDesktopFullscreenContentWidth(shell.clientWidth)
  return measured > 0 ? measured : undefined
}

function applyCoverVarsToShell(shell: HTMLElement | null, vars: CSSProperties) {
  if (!shell) return
  for (const [key, value] of Object.entries(vars)) {
    if (!key.startsWith('--')) continue
    if (value === '' || value === undefined) {
      shell.style.removeProperty(key)
    } else if (typeof value === 'string') {
      shell.style.setProperty(key, value)
    }
  }
}

function syncCoverVars(shell: HTMLElement | null, setCoverVars: (vars: CSSProperties) => void, vars: CSSProperties) {
  applyCoverVarsToShell(shell, vars)
  setCoverVars(vars)
}

function miniCoverCssVars(aspectRatio: number): CSSProperties {
  const viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth
  const isDesktop = isDesktopViewport(viewportWidth)
  const mini = miniCoverSize(aspectRatio, isDesktop)

  return {
    '--cover-image-width-collapsed': `${mini.width}px`,
    '--cover-image-height-collapsed': `${mini.height}px`,
    '--cover-w-over-h': String(coverWidthOverHeight(aspectRatio))
  } as CSSProperties
}

export function useFullscreenCoverLayout(
  shellRef: RefObject<HTMLDivElement | null>,
  aspectRatio: number,
  isPlayerFullscreen: boolean,
  isDesktop: boolean,
  layoutKey: string
): CSSProperties {
  const [coverVars, setCoverVars] = useState<CSSProperties>(() => miniCoverCssVars(aspectRatio))

  useLayoutEffect(() => {
    setCoverVars(miniCoverCssVars(aspectRatio))
  }, [aspectRatio])

  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell || !isPlayerFullscreen) {
      syncCoverVars(shell, setCoverVars, miniCoverCssVars(aspectRatio))
      return
    }

    const measure = () => {
      if (!shell.classList.contains('fullscreen')) return

      const shellWidth = shell.clientWidth
      const shellHeight = shell.clientHeight
      const landscapeCompact = isLandscapeCompactViewport(shellWidth, shellHeight)
      const chrome = measureChrome(shell)
      const naturalSize = measureCoverNaturalSize(shell)
      const reservedBelowCoverPx = (landscapeCompact ? 0 : measureReservedBelowCover(shell)) + FULLSCREEN_COVER_COLUMN_GAP_PX
      const portraitContentMaxWidth = measurePortraitContentBlockWidth(shell, isDesktop)

      if (landscapeCompact) {
        const layout = fitLandscapeCompactLayout({
          shellWidth,
          shellHeight,
          aspectRatio,
          chrome,
          naturalSize
        })
        syncCoverVars(shell, setCoverVars, {
          ...miniCoverCssVars(aspectRatio),
          '--cover-image-width': `${layout.cover.width}px`,
          '--cover-image-height': `${layout.cover.height}px`,
          '--player-landscape-col-width': `${layout.columnWidth}px`,
          '--player-landscape-col-min-width': `${LANDSCAPE_COMPACT_COL_MIN_WIDTH}px`
        } as CSSProperties)
        return
      }

      const fitted = fitFullscreenCoverInRemainingSpace({
        shellWidth,
        shellHeight,
        aspectRatio,
        isDesktop,
        isLandscapeCompact: landscapeCompact,
        chrome,
        reservedBelowCoverPx,
        naturalSize,
        portraitContentMaxWidth
      })

      syncCoverVars(shell, setCoverVars, {
        ...miniCoverCssVars(aspectRatio),
        '--cover-image-width': `${fitted.width}px`,
        '--cover-image-height': `${fitted.height}px`,
        '--player-landscape-col-width': '',
        '--player-landscape-col-min-width': ''
      } as CSSProperties)
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(shell)

    const rightColumn = shell.querySelector('.player-right-column')
    if (rightColumn) {
      resizeObserver.observe(rightColumn)
    }

    const coverImg = shell.querySelector('.player-cover img')
    coverImg?.addEventListener('load', measure)

    window.addEventListener('resize', measure)
    return () => {
      resizeObserver.disconnect()
      coverImg?.removeEventListener('load', measure)
      window.removeEventListener('resize', measure)
    }
  }, [aspectRatio, isDesktop, isPlayerFullscreen, layoutKey, shellRef])

  return coverVars
}
