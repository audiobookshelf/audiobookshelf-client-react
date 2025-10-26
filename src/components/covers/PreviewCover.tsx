'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface PreviewCoverProps {
  src: string
  width?: number
  bookCoverAspectRatio: number
  showResolution?: boolean
  forceErrorState?: boolean // For testing purposes
  onClick?: () => void
}

export default function PreviewCover({ src, width = 120, bookCoverAspectRatio, showResolution = true, forceErrorState = false, onClick }: PreviewCoverProps) {
  const t = useTypeSafeTranslations()
  const [imageFailed, setImageFailed] = useState(forceErrorState || false)
  const [showCoverBg, setShowCoverBg] = useState(false)
  const [naturalHeight, setNaturalHeight] = useState(0)
  const [naturalWidth, setNaturalWidth] = useState(0)

  const coverRef = useRef<HTMLImageElement>(null)
  const coverBgRef = useRef<HTMLDivElement>(null)

  // Calculate final dimensions
  const finalDimensions = useMemo(() => {
    const finalWidth = width
    const finalHeight = width * bookCoverAspectRatio

    return { width: finalWidth, height: finalHeight }
  }, [width, bookCoverAspectRatio])

  const sizeMultiplier = useMemo(() => finalDimensions.width / 120, [finalDimensions.width])

  const invalidCoverFontSize = useMemo(() => Math.max(sizeMultiplier * 0.8, 0.5), [sizeMultiplier])

  const placeholderCoverPadding = useMemo(() => 0.8 * sizeMultiplier, [sizeMultiplier])

  const resolution = useMemo(() => {
    if (!naturalWidth || !naturalHeight) return null
    return `${naturalWidth}×${naturalHeight}px`
  }, [naturalWidth, naturalHeight])

  const imageLoaded = useCallback(() => {
    if (coverRef.current) {
      const { naturalWidth: imgNaturalWidth, naturalHeight: imgNaturalHeight } = coverRef.current
      setNaturalHeight(imgNaturalHeight)
      setNaturalWidth(imgNaturalWidth)

      const aspectRatio = imgNaturalHeight / imgNaturalWidth
      const arDiff = Math.abs(aspectRatio - bookCoverAspectRatio)

      // If image aspect ratio is significantly different from target aspect ratio, use background image
      // This happens when arDiff > 0.15 (i.e., image is not close to 1.45-1.75 range for typical book covers)
      if (arDiff > 0.15) {
        setShowCoverBg(true)
      } else {
        setShowCoverBg(false)
      }
    }
  }, [bookCoverAspectRatio])

  // Set background image when showCoverBg changes to true
  useEffect(() => {
    if (showCoverBg && coverBgRef.current) {
      coverBgRef.current.style.backgroundImage = `url("${src}")`
    }
  }, [showCoverBg, src])

  const imageError = useCallback(
    (err: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Log with more context - this is a handled error so we use warn instead of error
      console.warn('PreviewCover: Failed to load image', {
        src,
        naturalWidth: err.currentTarget.naturalWidth,
        naturalHeight: err.currentTarget.naturalHeight,
        errorType: err.type
      })
      setImageFailed(true)
    },
    [src]
  )

  // Reset imageFailed when src changes
  useEffect(() => {
    setImageFailed(forceErrorState || false)
  }, [src, forceErrorState])

  // No effect needed for background image; it is bound directly in JSX now

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onClick) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    },
    [onClick]
  )

  return (
    <div
      className="relative rounded-xs"
      style={{
        height: `${finalDimensions.height}px`,
        width: `${finalDimensions.width}px`,
        maxWidth: `${finalDimensions.width}px`,
        minWidth: `${finalDimensions.width}px`
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full h-full relative overflow-hidden">
        {showCoverBg && (
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xs bg-primary">
            <div className="absolute cover-bg" ref={coverBgRef} />
          </div>
        )}
        <Image
          ref={coverRef}
          src={src}
          onError={imageError}
          onLoad={imageLoaded}
          alt={t('LabelCoverPreview')}
          fill
          unoptimized
          className={mergeClasses(showCoverBg ? 'object-contain' : 'object-fill')}
        />
      </div>

      {imageFailed && (
        <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-red-100" style={{ padding: `${placeholderCoverPadding}rem` }}>
          <div className="w-full h-full border-2 border-error flex flex-col items-center justify-center">
            {width > 100 && <Image src="/images/Logo.png" alt={t('LabelLogo')} width={40 * sizeMultiplier} height={40 * sizeMultiplier} className="mb-2" />}
            <p className="text-center text-error" style={{ fontSize: `${invalidCoverFontSize}rem` }}>
              {t('MessageInvalidCover')}
            </p>
          </div>
        </div>
      )}

      {!imageFailed && showResolution && resolution && (
        <p className="absolute -bottom-5 left-0 right-0 mx-auto text-xs text-gray-300 text-center">{resolution}</p>
      )}
    </div>
  )
}
