'use client'

import { RefObject, useEffect, useState } from 'react'

export interface Dimensions {
  width: number
  height: number
}

export interface DimensionRef {
  ref: RefObject<HTMLDivElement | null>
  setDims: (dims: Dimensions) => void
}

export function DimensionComparison({ cardDimensions, skeletonDimensions }: { cardDimensions: Dimensions | null; skeletonDimensions: Dimensions | null }) {
  if (!cardDimensions || !skeletonDimensions) {
    return <p className="text-xs text-gray-500 mt-2">Measuring dimensions...</p>
  }

  const widthMatch = Math.abs(cardDimensions.width - skeletonDimensions.width) < 1
  const heightMatch = Math.abs(cardDimensions.height - skeletonDimensions.height) < 1
  const allMatch = widthMatch && heightMatch

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs">
      <p className="font-bold mb-2 text-white">Dimension Check:</p>
      <div className="space-y-1">
        <p className={widthMatch ? 'text-green-400' : 'text-red-400'}>
          Width: Card {cardDimensions.width.toFixed(2)}px | Skeleton {skeletonDimensions.width.toFixed(2)}px {widthMatch ? '✓' : '✗'}
        </p>
        <p className={heightMatch ? 'text-green-400' : 'text-red-400'}>
          Height: Card {cardDimensions.height.toFixed(2)}px | Skeleton {skeletonDimensions.height.toFixed(2)}px {heightMatch ? '✓' : '✗'}
        </p>
        <p className={`font-bold ${allMatch ? 'text-green-400' : 'text-red-400'}`}>{allMatch ? '✓ Dimensions match!' : '✗ Dimensions do not match'}</p>
      </div>
    </div>
  )
}

/**
 * Hook to measure element dimensions using ResizeObserver
 */
export function useDimensionMeasurement(refs: DimensionRef[], deps: unknown[] = []) {
  useEffect(() => {
    const measureElement = (ref: RefObject<HTMLDivElement | null>, setter: (dims: Dimensions) => void) => {
      if (!ref.current) return

      // Initial measurement
      const rect = ref.current.getBoundingClientRect()
      setter({ width: rect.width, height: rect.height })

      // Continue observing for changes
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setter({ width, height })
        }
      })

      resizeObserver.observe(ref.current)
      return () => resizeObserver.disconnect()
    }

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      const cleanups = refs.map(({ ref, setDims }) => measureElement(ref, setDims))

      return () => {
        cleanups.forEach((cleanup) => cleanup?.())
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Hook to create dimension state and ref pair
 */
export function useDimensionState(): [Dimensions | null, (dims: Dimensions) => void, RefObject<HTMLDivElement | null>] {
  const [dims, setDims] = useState<Dimensions | null>(null)
  const ref = { current: null } as RefObject<HTMLDivElement | null>
  return [dims, setDims, ref]
}
