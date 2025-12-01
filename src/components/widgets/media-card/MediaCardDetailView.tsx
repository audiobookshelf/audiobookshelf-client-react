'use client'

import Tooltip from '@/components/ui/Tooltip'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import { useTruncation } from '@/hooks/useTruncation'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { LibraryItem } from '@/types/api'
import { useId } from 'react'
import { formatSortLine } from './formatSortLine'

interface MediaCardDetailViewProps {
  displayTitle: string
  displaySubtitle: string
  displayLineTwo: string
  isExplicit: boolean
  showSubtitles: boolean
  orderBy?: string
  libraryItem: LibraryItem
  media: LibraryItem['media']
  dateFormat: string
  timeFormat: string
  lastUpdated: number | null
  startedAt: number | null
  finishedAt: number | null
  isSkeleton?: boolean
}

export default function MediaCardDetailView({
  displayTitle,
  displaySubtitle,
  displayLineTwo,
  isExplicit,
  showSubtitles,
  orderBy,
  libraryItem,
  media,
  dateFormat,
  timeFormat,
  lastUpdated,
  startedAt,
  finishedAt,
  isSkeleton = false
}: MediaCardDetailViewProps) {
  const t = useTypeSafeTranslations()
  const descriptionId = useId()
  const { ref: titleRef, isTruncated: displayTitleTruncated } = useTruncation(displayTitle, isSkeleton)
  const { ref: subtitleRef, isTruncated: displaySubtitleTruncated } = useTruncation(displaySubtitle, isSkeleton)

  return (
    <div cy-id="detailBottom" id={descriptionId} dir="auto" className="relative mt-2 mb-2 start-0 z-50 w-full">
      <div style={{ fontSize: `${0.9}em` }}>
        {isSkeleton ? (
          <div className="flex items-center" aria-busy="true" aria-live="polite">
            <div
              className="h-[1em] w-3/4 rounded animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
              style={{
                animationDelay: '0s',
                animationDuration: '1.5s'
              }}
              aria-hidden="true"
            />
            &nbsp;
          </div>
        ) : displayTitleTruncated ? (
          <Tooltip text={displayTitle} position="bottom" className="flex items-center">
            <p cy-id="title" ref={titleRef} className="truncate">
              {displayTitle}
            </p>
            {isExplicit && <ExplicitIndicator className="ms-1" />}
          </Tooltip>
        ) : (
          <div className="flex items-center">
            <p cy-id="title" ref={titleRef} className="truncate">
              {displayTitle}
            </p>
            {isExplicit && <ExplicitIndicator className="ms-1" />}
          </div>
        )}
      </div>
      {showSubtitles &&
        (isSkeleton ? (
          <p className="truncate" style={{ fontSize: `${0.6}em` }} aria-busy="true" aria-live="polite">
            <span
              className="inline-block h-[1em] w-1/2 rounded animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
              style={{
                animationDelay: '0.1s',
                animationDuration: '1.5s'
              }}
              aria-hidden="true"
            />
            &nbsp;
          </p>
        ) : displaySubtitleTruncated ? (
          <Tooltip text={displaySubtitle} position="bottom" className="flex items-center">
            <p cy-id="subtitle" ref={subtitleRef} className="truncate" style={{ fontSize: `${0.6}em` }}>
              {displaySubtitle}
            </p>
          </Tooltip>
        ) : (
          <p cy-id="subtitle" ref={subtitleRef} className="truncate" style={{ fontSize: `${0.6}em` }}>
            {displaySubtitle}
          </p>
        ))}
      {isSkeleton ? (
        <p className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }} aria-busy="true" aria-live="polite">
          <span
            className="inline-block h-[1em] w-2/3 rounded animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
            style={{
              animationDelay: '0.2s',
              animationDuration: '1.5s'
            }}
            aria-hidden="true"
          />
          &nbsp;
        </p>
      ) : (
        <p cy-id="line2" className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }}>
          {displayLineTwo || '\u00A0'}
        </p>
      )}
      {orderBy &&
        (isSkeleton ? (
          <p className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }} aria-busy="true" aria-live="polite">
            <span
              className="inline-block h-[1em] w-1/2 rounded animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
              style={{
                animationDelay: '0.3s',
                animationDuration: '1.5s'
              }}
              aria-hidden="true"
            />
            &nbsp;
          </p>
        ) : (
          <p cy-id="line3" className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }}>
            {formatSortLine(orderBy, {
              libraryItem,
              media,
              dateFormat,
              timeFormat,
              lastUpdated,
              startedAt,
              finishedAt,
              t
            })}
          </p>
        ))}
    </div>
  )
}
