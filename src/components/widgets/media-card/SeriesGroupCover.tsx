'use client'

import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface SeriesGroupCoverProps {
  /** Series name (used as fallback when no covers available) */
  name: string
  /** Books in the series */
  books: LibraryItem[]
  /** Width of the cover area in pixels */
  width: number
  /** Height of the cover area in pixels */
  height: number
  /** Book cover aspect ratio (1 = square, 1.6 = standard) */
  bookCoverAspectRatio: number
}

interface CoverData {
  id: string
  coverUrl: string
  showCoverBg: boolean
}

const MAX_COVERS = 10

export default function SeriesGroupCover({ name, books, width, height, bookCoverAspectRatio }: SeriesGroupCoverProps) {
  const [coverData, setCoverData] = useState<CoverData[]>([])
  const [noValidCovers, setNoValidCovers] = useState(false)
  const mountedRef = useRef(true)
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  const sizeMultiplier = useMemo(() => {
    if (bookCoverAspectRatio === 1) return width / (120 * 1.6 * 2)
    return width / 240
  }, [bookCoverAspectRatio, width])

  // Single cover width based on aspect ratio
  const coverWidth = useMemo(() => height / bookCoverAspectRatio, [height, bookCoverAspectRatio])

  // Calculate offset increment for stacking covers
  const offsetIncrement = useMemo(() => {
    const validCount = Math.min(books.length, MAX_COVERS)
    if (validCount <= 1) return 0
    return (width - coverWidth) / (validCount - 1)
  }, [books.length, width, coverWidth])

  const checkImageAspectRatio = useCallback(
    (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const image = new Image()
        image.onload = () => {
          const { naturalWidth, naturalHeight } = image
          const aspectRatio = naturalHeight / naturalWidth
          const arDiff = Math.abs(aspectRatio - bookCoverAspectRatio)
          // If image aspect ratio differs by more than 0.15, show background
          resolve(arDiff > 0.15)
        }
        image.onerror = () => resolve(false)
        image.src = src
      })
    },
    [bookCoverAspectRatio]
  )

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    async function loadCovers() {
      // Filter books that have covers
      const validBooks = books
        .map((book) => ({
          id: book.id,
          coverUrl: getLibraryItemCoverSrc(book, placeholderUrl)
        }))
        .filter((b) => b.coverUrl !== placeholderUrl)
        .slice(0, MAX_COVERS)

      if (validBooks.length === 0) {
        if (mountedRef.current) {
          setNoValidCovers(true)
          setCoverData([])
        }
        return
      }

      // Force cover background for single cover
      const forceCoverBg = validBooks.length === 1

      // Check aspect ratios for all covers
      const results = await Promise.all(
        validBooks.map(async (book) => ({
          id: book.id,
          coverUrl: book.coverUrl,
          showCoverBg: forceCoverBg || (await checkImageAspectRatio(book.coverUrl))
        }))
      )

      if (mountedRef.current) {
        setNoValidCovers(false)
        setCoverData(results)
      }
    }

    loadCovers()
  }, [books, checkImageAspectRatio, placeholderUrl])

  // Fallback when no valid covers
  if (noValidCovers) {
    return (
      <div className="absolute top-0 start-0 w-full h-full flex items-center justify-center box-shadow-book" style={{ padding: `${sizeMultiplier}rem` }}>
        <p style={{ fontSize: `${sizeMultiplier}rem` }} className="text-center text-gray-200">
          {name}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative box-shadow-book">
      {coverData.map((cover, index) => {
        const offsetLeft = coverData.length === 1 ? 0 : offsetIncrement * index
        const zIndex = coverData.length - index
        const isLastCover = index === coverData.length - 1
        const displayWidth = coverData.length === 1 ? width : coverWidth

        return (
          <div
            key={`${cover.id}-${index}`}
            className="absolute top-0 transition-transform"
            style={{
              height: `${height}px`,
              width: `${displayWidth}px`,
              left: `${offsetLeft}px`,
              zIndex,
              boxShadow: isLastCover ? undefined : '4px 0px 4px #11111166'
            }}
          >
            {/* Cover background for aspect ratio mismatches */}
            {cover.showCoverBg && (
              <div className="absolute top-0 start-0 w-full h-full overflow-hidden rounded-xs bg-primary">
                <div
                  className="absolute cover-bg"
                  style={{
                    backgroundImage: `url("${cover.coverUrl}")`
                  }}
                />
              </div>
            )}

            {/* Cover image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.coverUrl}
              alt=""
              aria-hidden="true"
              className={mergeClasses('absolute top-0 start-0 w-full h-full', cover.showCoverBg ? 'object-contain' : 'object-cover')}
            />
          </div>
        )
      })}
    </div>
  )
}

