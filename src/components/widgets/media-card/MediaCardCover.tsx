'use client'

import { getLibraryItemCoverSrc } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface MediaCardCoverProps {
  libraryItem: LibraryItem
  coverWidth: number
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
  coverWidth,
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

  const bookCoverSrc = useMemo(() => getLibraryItemCoverSrc(libraryItem, placeholderUrl), [libraryItem, placeholderUrl])

  const [prevSrc, setPrevSrc] = useState(bookCoverSrc)

  // Reset image ready state when cover source changes
  useEffect(() => {
    if (bookCoverSrc !== prevSrc) {
      setPrevSrc(bookCoverSrc)
      setImageReady(false)
    }
  }, [bookCoverSrc, prevSrc])

  const handleImageLoaded = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
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

  return (
    <>
      {/* Cover background when image does not fill */}
      <div
        cy-id="coverBg"
        className="absolute top-0 start-0 w-full h-full overflow-hidden rounded-xs bg-primary"
        style={{ display: showCoverBg ? 'block' : 'none' }}
      >
        {showCoverBg && (
          <div
            className="absolute cover-bg"
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
          className="absolute top-0 start-0 w-full h-full flex items-center justify-center"
          style={{ padding: `${0.5}em` }}
        >
          <p style={{ fontSize: `${0.8}em` }} className="text-gray-300 text-center">
            {title}
          </p>
        </div>
      )}

      {/* Cover image */}
      {libraryItem && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          cy-id="coverImage"
          alt={`${title}, Cover`}
          aria-hidden="true"
          src={bookCoverSrc}
          onLoad={handleImageLoaded}
          className={mergeClasses('absolute inset-0 w-full h-full transition-opacity duration-300', showCoverBg ? 'object-contain' : 'object-fill')}
          style={{ opacity: imageReady ? 1 : 0 }}
        />
      )}

      {/* Placeholder cover title & author */}
      {!hasCover && (
        <>
          <div
            cy-id="placeholderTitle"
            className="absolute top-0 start-0 end-0 bottom-0 w-full h-full flex items-center justify-center"
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
            className="absolute start-0 end-0 w-full flex items-center justify-center"
            style={{ padding: `${PLACEHOLDER_COVER_PADDING}em`, bottom: `${AUTHOR_BOTTOM}em` }}
          >
            <p cy-id="placeholderAuthorText" aria-hidden="true" className="text-center text-amber-100 opacity-75" style={{ fontSize: `${AUTHOR_FONT_SIZE}em` }}>
              {authorCleaned}
            </p>
          </div>
        </>
      )}

      {/* Progress bar */}
      {!isPodcast && (
        <div
          cy-id="progressBar"
          className={mergeClasses(
            'absolute bottom-0 start-0 h-1 max-w-full z-20 rounded-b box-shadow-progressbar',
            itemIsFinished ? 'bg-success' : 'bg-yellow-400'
          )}
          style={{ width: `${coverWidth * userProgressPercent}px` }}
        />
      )}
    </>
  )
}
