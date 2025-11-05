'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { MatchResult } from '@/types/api'
import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

interface MatchCardProps {
  book: MatchResult
  isPodcast?: boolean
  currentBookDuration?: number // in seconds
  onSelect?: (book: MatchResult) => void
  isFocused?: boolean
  cardIndex?: number
  onArrowKey?: (direction: 'up' | 'down', index: number) => void
}

export default function MatchCard({ book, isPodcast = false, currentBookDuration = 0, onSelect, isFocused = false, cardIndex, onArrowKey }: MatchCardProps) {
  const t = useTypeSafeTranslations()
  const [selectedCover, setSelectedCover] = useState<string | null>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const bookCovers = useMemo(() => book.covers || [], [book.covers])

  // Initialize selected cover on mount (matching Vue component behavior)
  useEffect(() => {
    if (bookCovers.length > 0) {
      setSelectedCover(bookCovers[0])
    } else if (book.cover) {
      setSelectedCover(book.cover)
    } else {
      setSelectedCover(null)
    }
  }, [bookCovers, book.cover])

  const finalSelectedCover = selectedCover

  // Book duration in seconds
  const bookDurationSeconds = useMemo(() => {
    if (!book.duration) return 0
    return book.duration * 60
  }, [book.duration])

  const durationComparison = useMemo(() => {
    if (!book.duration || !currentBookDuration) return ''
    const currentBookDurationMinutes = Math.floor(currentBookDuration / 60)
    const differenceInMinutes = currentBookDurationMinutes - book.duration

    if (differenceInMinutes < 0) {
      const diffSeconds = Math.abs(differenceInMinutes) * 60
      return t('LabelDurationComparisonLonger', { 0: secondsToTimestamp(diffSeconds) })
    } else if (differenceInMinutes > 0) {
      const diffSeconds = differenceInMinutes * 60
      return t('LabelDurationComparisonShorter', { 0: secondsToTimestamp(diffSeconds) })
    }
    return t('LabelDurationComparisonExactMatch')
  }, [book.duration, currentBookDuration, t])

  const narratorText = useMemo(() => {
    if (!isPodcast && 'narrator' in book && book.narrator) {
      if (Array.isArray(book.narrator)) {
        return book.narrator.join(', ')
      }
      return book.narrator
    }
    return null
  }, [book, isPodcast])

  const genresText = useMemo(() => {
    if (!book.genres) return null
    if (Array.isArray(book.genres)) {
      return book.genres.join(', ')
    }
    return book.genres
  }, [book.genres])

  const handleSelect = useCallback(() => {
    if (onSelect) {
      const bookWithCover = { ...book, cover: finalSelectedCover || undefined }
      onSelect(bookWithCover)
    }
  }, [onSelect, book, finalSelectedCover])

  const handleCoverClick = useCallback((e: React.MouseEvent, cover: string) => {
    e.stopPropagation()
    setSelectedCover(cover)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect()
      } else if (e.key === 'ArrowDown' && cardIndex !== undefined && onArrowKey) {
        e.preventDefault()
        onArrowKey('down', cardIndex)
      } else if (e.key === 'ArrowUp' && cardIndex !== undefined && onArrowKey) {
        e.preventDefault()
        onArrowKey('up', cardIndex)
      }
    },
    [handleSelect, cardIndex, onArrowKey]
  )

  // Focus the card when isFocused becomes true
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus()
    }
  }, [isFocused])

  const matchConfidencePercentage = useMemo(() => {
    if (!book.matchConfidence) return null
    return (book.matchConfidence * 100).toFixed(0)
  }, [book.matchConfidence])

  if (!book) return null

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="option"
      aria-selected={isFocused}
      aria-label={`Select ${book.title}`}
      className={mergeClasses('w-full border rounded p-3', 'border-border', 'focus:border-foreground', 'outline-none')}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col md:flex-row py-1 hover:bg-bg-hover/50 cursor-pointer">
        {/* Mobile: cover image with published year and confidence on the right */}
        {/* Desktop: cover image on the left */}
        <div className="flex justify-between md:block">
          <div className="min-w-12 max-w-12 md:min-w-20 md:max-w-20 shrink-0 md:pt-1 md:pl-2">
            <div className="w-full bg-primary" style={{ aspectRatio: '1' }}>
              {finalSelectedCover ? (
                <div className="relative w-full h-full">
                  <Image src={finalSelectedCover} alt="" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="w-12 h-12 md:w-20 md:h-20 bg-primary" />
              )}
            </div>
          </div>
          {/* Mobile: published year and confidence right-aligned on the card */}
          <div className="flex flex-col items-end justify-start gap-1 px-2 md:hidden">
            {'publishedYear' in book && book.publishedYear && <p className="text-sm font-medium text-right">{book.publishedYear}</p>}
            {matchConfidencePercentage && (
              <div
                className={mergeClasses(
                  'rounded-full px-2 py-1 text-xs whitespace-nowrap text-foreground',
                  book.matchConfidence! > 0.95 ? 'bg-success/80' : 'bg-info/80'
                )}
              >
                {t('LabelMatchConfidence')}: {matchConfidencePercentage}%
              </div>
            )}
          </div>
        </div>
        {!isPodcast ? (
          <div className="pl-0 pr-2 md:px-4 grow mt-2 md:mt-0">
            <div className="flex items-center">
              <h1 className="text-sm md:text-base">{book.title}</h1>
              <div className="grow" />
              {/* Desktop: published year */}
              {'publishedYear' in book && book.publishedYear && <p className="hidden md:block text-sm md:text-base">{book.publishedYear}</p>}
            </div>

            <div className="flex items-center">
              <div>
                {book.author && <p className="text-foreground-muted text-xs md:text-sm">{t('LabelByAuthor', { 0: book.author })}</p>}
                {narratorText && (
                  <p className="text-foreground-subdued text-xs">
                    {t('LabelNarrators')}: {narratorText}
                  </p>
                )}
                {bookDurationSeconds > 0 && (
                  <p className="text-foreground-subdued text-xs">
                    {t('LabelDuration')}: {secondsToTimestamp(bookDurationSeconds)} {durationComparison}
                  </p>
                )}
              </div>
              <div className="grow" />
              {/* Desktop: confidence badge */}
              {matchConfidencePercentage && (
                <div
                  className={mergeClasses(
                    'hidden md:flex rounded-full px-2 py-1 text-xs whitespace-nowrap text-foreground',
                    book.matchConfidence! > 0.95 ? 'bg-success/80' : 'bg-info/80'
                  )}
                >
                  {t('LabelMatchConfidence')}: {matchConfidencePercentage}%
                </div>
              )}
            </div>

            {'series' in book && book.series && book.series.length > 0 && (
              <div className="flex py-1 -mx-1">
                {book.series.map((series, index) => (
                  <div key={index} className="bg-white/10 rounded-full px-1 py-0.5 mx-1">
                    <p className="leading-3 text-xs text-foreground-subdued">
                      {series.series}
                      {series.sequence && <>&nbsp;#{series.sequence}</>}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {book.descriptionPlain && (
              <div className="w-full max-h-12 overflow-hidden">
                <p className="text-foreground-subdued text-xs">{book.descriptionPlain}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="pl-0 pr-2 md:px-4 grow mt-2 md:mt-0">
            <h1>
              <div className="flex items-center">
                {book.title}
                {book.explicit && <span className="material-symbols text-sm ms-1 text-error">explicit</span>}
              </div>
            </h1>
            {book.author && <p className="text-base text-foreground-muted whitespace-nowrap truncate">{t('LabelByAuthor', { 0: book.author })}</p>}
            {genresText && <p className="text-xs text-foreground-subdued leading-5">{genresText}</p>}
            {'trackCount' in book && book.trackCount !== undefined && (
              <p className="text-xs text-foreground-subdued leading-5">
                {book.trackCount} {t('LabelEpisodes')}
              </p>
            )}
          </div>
        )}
      </div>
      {bookCovers.length > 1 && (
        <div className="flex">
          {bookCovers.map((cover, index) => (
            <div
              key={index}
              className={mergeClasses(
                'border-2 hover:border-yellow-300 border-transparent cursor-pointer',
                cover === finalSelectedCover ? 'border-yellow-200' : ''
              )}
              onClick={(e) => handleCoverClick(e, cover)}
            >
              <div className="relative h-20 w-12 mr-1">
                <Image src={cover} alt="" fill className="object-cover" unoptimized />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
