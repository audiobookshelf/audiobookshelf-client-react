import { extractAverageAccentRgb } from '@/lib/extractCoverAccentColor'
import { useEffect, useState } from 'react'

export type AccentRgb = { r: number; g: number; b: number }

/**
 * Computes a simple average accent RGB from cover art URL (same-origin URLs only for canvas reads).
 */
export function useCoverAccentColor(imageUrl: string | null): AccentRgb | null {
  const [accent, setAccent] = useState<AccentRgb | null>(null)

  useEffect(() => {
    let active = true

    if (!imageUrl) {
      setAccent(null)
      return () => {
        active = false
      }
    }

    setAccent(null)

    extractAverageAccentRgb(imageUrl)
      .then((rgb) => {
        if (active) setAccent(rgb)
      })
      .catch(() => {
        if (active) setAccent(null)
      })

    return () => {
      active = false
    }
  }, [imageUrl])

  return accent
}
