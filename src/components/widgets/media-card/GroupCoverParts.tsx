'use client'

import { getContainedCoverDimensions, shouldShowCoverBackground, type GroupCoverData } from '@/hooks/useGroupCoverData'
import { mergeClasses } from '@/lib/merge-classes'
import type { CSSProperties } from 'react'

interface GroupCoverEmptyStateProps {
  width: number
  height: number
  sizeMultiplier: number
  label: string
}

export function GroupCoverEmptyState({ width, height, sizeMultiplier, label }: GroupCoverEmptyStateProps) {
  return (
    <div
      className="bg-primary relative flex h-full w-full items-center justify-center rounded-xs"
      style={{ width: `${width}px`, height: `${height}px`, padding: `${sizeMultiplier}em` }}
    >
      <div className="absolute top-0 left-0 h-full w-full bg-gray-400/5" />
      <p className="z-10 text-center text-white/60" style={{ fontSize: `${Math.min(1, sizeMultiplier)}em` }}>
        {label}
      </p>
    </div>
  )
}

interface GroupCoverCellProps {
  cover: GroupCoverData
  width: number
  height: number
  /** Image style used when the cover fills the cell without an aspect-ratio background */
  fallbackImageStyle?: CSSProperties
  /** Extra classes on the blurred cover background wrapper */
  coverBgClassName?: string
  className?: string
}

export function GroupCoverCell({ cover, width, height, fallbackImageStyle, coverBgClassName, className }: GroupCoverCellProps) {
  const showCoverBg = shouldShowCoverBackground(cover.imageAspectRatio, width, height)
  const imageStyle = showCoverBg ? getContainedCoverDimensions(width, height, cover.imageAspectRatio!) : fallbackImageStyle

  return (
    <div className={mergeClasses('relative z-10 flex items-center justify-center', className)} style={{ width: `${width}px`, height: `${height}px` }}>
      {showCoverBg && (
        <div className={mergeClasses('bg-primary absolute start-0 top-0 h-full w-full overflow-hidden', coverBgClassName)}>
          <div className="cover-bg absolute" style={{ backgroundImage: `url("${cover.coverUrl}")` }} />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.coverUrl}
        alt=""
        aria-hidden="true"
        className={mergeClasses('relative z-10', showCoverBg ? 'object-contain' : 'h-full w-full object-cover')}
        style={imageStyle}
      />
    </div>
  )
}
