'use client'

import { getLibraryItemCoverSrc } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface MediaCardCoverProps {
  libraryItem?: LibraryItem
  /** When set, used instead of resolving cover from libraryItem (e.g. player queue rows). */
  coverSrc?: string
  coverAspect: number
  placeholderUrl: string
  hasCover: boolean
  title: string
  author: string
  userProgressPercent: number
  itemIsFinished: boolean
  showProgressBar: boolean
  onImageLoad?: (showBg: boolean) => void
  onNaturalSize?: (width: number, height: number) => void
  /** Title/author overlays for missing covers. Defaults to true. */
  showPlaceholderText?: boolean
}

export default function MediaCardCover({
  libraryItem,
  coverSrc,
  coverAspect,
  placeholderUrl,
  hasCover,
  title,
  author,
  userProgressPercent,
  itemIsFinished,
  showProgressBar,
  onImageLoad,
  onNaturalSize,
  showPlaceholderText = true
}: MediaCardCoverProps) {
  const [imageReady, setImageReady] = useState(false)
  const [showCoverBg, setShowCoverBg] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const hasHandledLoad = useRef(false)

  const bookCoverSrc = useMemo(() => {
    if (coverSrc !== undefined) {
      return coverSrc
    }
    if (libraryItem) {
      return getLibraryItemCoverSrc(libraryItem, placeholderUrl)
    }
    return placeholderUrl
  }, [coverSrc, libraryItem, placeholderUrl])

  const [prevSrc, setPrevSrc] = useState(bookCoverSrc)

  // Reset image ready state when cover source changes (e.g. libraryItem.updatedAt cache-bust).
  // Must clear hasHandledLoad too — otherwise onLoad bails out and the cover stays at opacity 0.
  useEffect(() => {
    if (bookCoverSrc !== prevSrc) {
      setPrevSrc(bookCoverSrc)
      setImageReady(false)
      hasHandledLoad.current = false
      onNaturalSize?.(0, 0)
    }
  }, [bookCoverSrc, onNaturalSize, prevSrc])

  const handleImageLoaded = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (hasHandledLoad.current) return
      hasHandledLoad.current = true

      const img = event.currentTarget
      setImageReady(true)
      onNaturalSize?.(img.naturalWidth, img.naturalHeight)

      if (bookCoverSrc !== placeholderUrl) {
        const { naturalWidth, naturalHeight } = img
        const aspectRatio = naturalHeight / naturalWidth
        const arDiff = Math.abs(aspectRatio - coverAspect)

        const shouldShowBg = arDiff > 0.15
        setShowCoverBg(shouldShowBg)
        onImageLoad?.(shouldShowBg)
      }
    },
    [bookCoverSrc, coverAspect, onImageLoad, onNaturalSize, placeholderUrl]
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
      {showPlaceholderText && libraryItem && !imageReady && (
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* Placeholder cover title & author */}
      {showPlaceholderText && !hasCover && (
        <div className="absolute inset-0 flex flex-col p-[15%]">
          <div cy-id="placeholderTitle" className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
            <p cy-id="placeholderTitleText" aria-hidden="true" className="line-clamp-4 w-full min-w-0 text-center text-[0.75em] wrap-break-word text-amber-100">
              {title}
            </p>
          </div>
          {author ? (
            <div cy-id="placeholderAuthor" className="py-2e flex w-full shrink-0 items-center justify-center">
              <p cy-id="placeholderAuthorText" aria-hidden="true" className="w-full min-w-0 truncate text-center text-[0.6em] text-amber-100 opacity-75">
                {author}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Progress bar */}
      {showProgressBar && (
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
