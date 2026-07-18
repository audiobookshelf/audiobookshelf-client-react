'use client'

import TruncatingTooltipText from '@/components/ui/TruncatingTooltipText'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
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

  return (
    <div cy-id="detailBottom" id={descriptionId} dir="auto" className="relative start-0 z-50 mt-2 mb-2 w-full">
      <div style={{ fontSize: `${0.9}em` }}>
        {isSkeleton ? (
          <div className="flex items-center" aria-busy="true" aria-live="polite">
            <div
              className="h-[1em] w-3/4 animate-pulse rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
              style={{
                animationDelay: '0s',
                animationDuration: '1.5s'
              }}
              aria-hidden="true"
            />
            &nbsp;
          </div>
        ) : (
          <div className="flex min-w-0 items-center">
            <div className="min-w-0 flex-1">
              <TruncatingTooltipText lazy text={displayTitle} position="bottom" />
            </div>
            {isExplicit && <ExplicitIndicator className="ms-1 shrink-0" />}
          </div>
        )}
      </div>
      {showSubtitles &&
        (isSkeleton ? (
          <p className="truncate" style={{ fontSize: `${0.6}em` }} aria-busy="true" aria-live="polite">
            <span
              className="inline-block h-[1em] w-1/2 animate-pulse rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
              style={{
                animationDelay: '0.1s',
                animationDuration: '1.5s'
              }}
              aria-hidden="true"
            />
            &nbsp;
          </p>
        ) : (
          <div className="block w-full min-w-0" style={{ fontSize: `${0.6}em` }}>
            <TruncatingTooltipText lazy text={displaySubtitle} position="bottom" />
          </div>
        ))}
      {isSkeleton ? (
        <p className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }} aria-busy="true" aria-live="polite">
          <span
            className="inline-block h-[1em] w-2/3 animate-pulse rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
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
        (() => {
          const sortLine = formatSortLine(orderBy, {
            libraryItem,
            media,
            dateFormat,
            timeFormat,
            lastUpdated,
            startedAt,
            finishedAt,
            t
          })
          // Only render if there's actual content or if skeleton
          if (isSkeleton) {
            return sortLine !== null ? (
              <p className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }} aria-busy="true" aria-live="polite">
                <span
                  className="inline-block h-[1em] w-1/2 animate-pulse rounded bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700"
                  style={{
                    animationDelay: '0.3s',
                    animationDuration: '1.5s'
                  }}
                  aria-hidden="true"
                />
                &nbsp;
              </p>
            ) : null
          }
          return sortLine ? (
            <p cy-id="line3" className="truncate text-gray-400" style={{ fontSize: `${0.8}em` }}>
              {sortLine}
            </p>
          ) : null
        })()}
    </div>
  )
}
