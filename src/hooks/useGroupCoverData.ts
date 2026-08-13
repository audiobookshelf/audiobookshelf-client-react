'use client'

import { getLibraryItemCoverSrc, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import type { LibraryItem } from '@/types/api'
import { useEffect, useMemo, useState } from 'react'

const ASPECT_RATIO_TOLERANCE = 0.15

export interface GroupCoverData {
  coverUrl: string
  imageAspectRatio: number | null
}

export function getContainedCoverDimensions(containerWidth: number, containerHeight: number, imageAspectRatio: number) {
  const width = Math.min(containerWidth, containerHeight / imageAspectRatio)
  return { width, height: width * imageAspectRatio }
}

export function shouldShowCoverBackground(imageAspectRatio: number | null, containerWidth: number, containerHeight: number) {
  if (imageAspectRatio === null) return false
  const containerAspectRatio = containerHeight / containerWidth
  return Math.abs(imageAspectRatio - containerAspectRatio) > ASPECT_RATIO_TOLERANCE
}

/**
 * Resolves group cover URLs and determines which ones need an aspect-ratio background.
 */
export function useGroupCoverData(libraryItems: LibraryItem[]): GroupCoverData[] {
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])
  const [loadedCoverData, setLoadedCoverData] = useState<GroupCoverData[]>([])

  const coverUrls = useMemo(() => libraryItems.map((item) => getLibraryItemCoverSrc(item, placeholderUrl)), [libraryItems, placeholderUrl])

  const coverData = useMemo(
    () =>
      coverUrls.map((coverUrl, index) => {
        const loadedCover = loadedCoverData[index]
        const hasCurrentCoverData = loadedCover?.coverUrl === coverUrl
        return {
          coverUrl,
          // Only reuse a completed result when it belongs to the current cover URL.
          imageAspectRatio: hasCurrentCoverData ? loadedCover.imageAspectRatio : null
        }
      }),
    [coverUrls, loadedCoverData]
  )

  useEffect(() => {
    let isCurrent = true

    async function loadCoverData() {
      if (!coverUrls.length) {
        setLoadedCoverData([])
        return
      }

      const results = await Promise.all(
        coverUrls.map(
          (coverUrl): Promise<GroupCoverData> =>
            new Promise((resolve) => {
              const image = new Image()
              image.onload = () => {
                const imageAspectRatio = image.naturalWidth ? image.naturalHeight / image.naturalWidth : null
                resolve({
                  coverUrl,
                  imageAspectRatio
                })
              }
              image.onerror = () => resolve({ coverUrl, imageAspectRatio: null })
              image.src = coverUrl
            })
        )
      )

      if (isCurrent) {
        setLoadedCoverData(results)
      }
    }

    loadCoverData()
    return () => {
      isCurrent = false
    }
  }, [coverUrls])

  return coverData
}
