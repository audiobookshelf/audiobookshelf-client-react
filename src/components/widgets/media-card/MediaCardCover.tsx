'use client'

import { getLibraryItemCoverSrc } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface MediaCardCoverProps {
  libraryItem: LibraryItem
  coverAspect: number
  placeholderUrl: string
  hasCover: boolean
  title: string
  titleCleaned: string
  authorCleaned: string
  isPodcast: boolean
  userProgressPercent: number
  itemIsFinished: boolean
  onImageLoad?: (showBg: boolean) => void
}

const PLACEHOLDER_COVER_PADDING = 0.8
const TITLE_FONT_SIZE = 0.75
const AUTHOR_FONT_SIZE = 0.6
const AUTHOR_BOTTOM = 0.75

export default function MediaCardCover({
  libraryItem,
  coverAspect,
  placeholderUrl,
  hasCover,
  title,
  titleCleaned,
  authorCleaned,
  isPodcast,
  userProgressPercent,
  itemIsFinished,
  onImageLoad
}: MediaCardCoverProps) {
  const [imageReady, setImageReady] = useState(false)
  const [showCoverBg, setShowCoverBg] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const hasHandledLoad = useRef(false)

  const bookCoverSrc = useMemo(() => getLibraryItemCoverSrc(libraryItem, placeholderUrl), [libraryItem, placeholderUrl])

  const [prevSrc, setPrevSrc] = useState(bookCoverSrc)

  // Reset image ready state when cover source changes (e.g. libraryItem.updatedAt cache-bust).
  // Must clear hasHandledLoad too — otherwise onLoad bails out and the cover stays at opacity 0.
  useEffect(() => {
    if (bookCoverSrc !== prevSrc) {
      setPrevSrc(bookCoverSrc)
      setImageReady(false)
      hasHandledLoad.current = false
    }
  }, [bookCoverSrc, prevSrc])

  const handleImageLoaded = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (hasHandledLoad.current) return
      hasHandledLoad.current = true

      const img = event.currentTarget
      setImageReady(true)

      if (bookCoverSrc !== placeholderUrl) {
        const { naturalWidth, naturalHeight } = img
        const aspectRatio = naturalHeight / naturalWidth
        const arDiff = Math.abs(aspectRatio - coverAspect)

        const shouldShowBg = arDiff > 0.15
        setShowCoverBg(shouldShowBg)
        onImageLoad?.(shouldShowBg)
      }
    },
    [bookCoverSrc, coverAspect, placeholderUrl, onImageLoad]
  )

  // Check if image is already loaded (e.g., from cache)
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      // Image was loaded from cache before event handler was attached
      handleImageLoaded({ currentTarget: img } as React.SyntheticEvent<HTMLImageElement>)
    }
  }, [bookCoverSrc, handleImageLoaded])

  return (
    <>
      {/* Cover background when image does not fill */}
      <div
        cy-id="coverBg"
        className="bg-primary absolute start-0 top-0 h-full w-full overflow-hidden rounded-xs"
        style={{ display: showCoverBg ? 'block' : 'none' }}
      >
        {showCoverBg && (
          <div
            className="cover-bg absolute"
            style={{
              backgroundImage: `url("${bookCoverSrc}")`
            }}
          />
        )}
      </div>

      {/* Placeholder title when image is not ready */}
      {libraryItem && !imageReady && (
        <div
          cy-id="titleImageNotReady"
          aria-hidden="true"
          className="absolute start-0 top-0 flex h-full w-full items-center justify-center"
          style={{ padding: `${0.5}em` }}
        >
          <p style={{ fontSize: `${0.8}em` }} className="text-center text-gray-300">
            {title}
          </p>
        </div>
      )}

      {/* Cover image */}
      {libraryItem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          cy-id="coverImage"
          alt={`${title}, Cover`}
          aria-hidden="true"
          src={bookCoverSrc}
          onLoad={handleImageLoaded}
          className={mergeClasses('absolute inset-0 h-full w-full transition-opacity duration-300', showCoverBg ? 'object-contain' : 'object-fill')}
          style={{ opacity: imageReady ? 1 : 0 }}
        />
      )}

      {/* Placeholder cover title & author */}
      {!hasCover && (
        <>
          <div
            cy-id="placeholderTitle"
            className="absolute start-0 end-0 top-0 bottom-0 flex h-full w-full items-center justify-center"
            style={{ padding: `${PLACEHOLDER_COVER_PADDING}em` }}
          >
            <div>
              <p cy-id="placeholderTitleText" aria-hidden="true" className="text-center text-amber-100" style={{ fontSize: `${TITLE_FONT_SIZE}em` }}>
                {titleCleaned}
              </p>
            </div>
          </div>
          <div
            cy-id="placeholderAuthor"
            className="absolute start-0 end-0 flex w-full items-center justify-center"
            style={{ padding: `${PLACEHOLDER_COVER_PADDING}em`, bottom: `${AUTHOR_BOTTOM}em` }}
          >
            <p cy-id="placeholderAuthorText" aria-hidden="true" className="text-center text-amber-100 opacity-75" style={{ fontSize: `${AUTHOR_FONT_SIZE}em` }}>
              {authorCleaned}
            </p>
          </div>
        </>
      )}

      {/* Progress bar */}
      {!isPodcast && userProgressPercent > 0 && (
        <div
          cy-id="progressBar"
          className={mergeClasses(
            'box-shadow-progressbar absolute start-0 bottom-0 z-20 h-1 max-w-full rounded-b',
            itemIsFinished ? 'bg-success' : 'bg-yellow-400'
          )}
          style={{ width: `${userProgressPercent * 100}%` }}
        />
      )}
    </>
  )
}
