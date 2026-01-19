'use client'

import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardOverlay from '@/components/widgets/media-card/MediaCardOverlay'
import { useCardSize } from '@/contexts/CardSizeContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { computeProgress } from '@/lib/mediaProgress'
import type { LibraryItem } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState } from 'react'
import { MediaCardProps } from './MediaCard'
import MediaCardDetailView from './MediaCardDetailView'
import MediaCardFrame from './MediaCardFrame'

export type CollapsedSeriesCardProps = Omit<MediaCardProps, 'userPermissions' | 'ereaderDevices'>

export default function CollapsedSeriesCard(props: CollapsedSeriesCardProps) {
  const {
    libraryItem,
    bookshelfView,
    orderBy,
    sortingIgnorePrefix = false,
    seriesProgressPercent,
    bookCoverAspectRatio,
    sizeMultiplier,
    dateFormat,
    timeFormat,
    showSubtitles,
    isSelectionMode = false,
    selected = false,
    onSelect
  } = props

  const t = useTypeSafeTranslations()
  const locale = useLocale()
  const router = useRouter()
  const { sizeMultiplier: contextSizeMultiplier } = useCardSize()
  const generatedId = useId()
  const cardId = props.id || generatedId

  // Use prop to override context value if provided
  const effectiveSizeMultiplier = sizeMultiplier ?? contextSizeMultiplier

  const [isHovering, setIsHovering] = useState(false)

  const collapsedSeries = libraryItem.collapsedSeries
  const booksInSeries = collapsedSeries?.numBooks || 0
  const seriesSequenceList = collapsedSeries?.seriesSequenceList || null
  const seriesName = collapsedSeries?.name || null

  const coverAspect = getCoverAspectRatio(bookCoverAspectRatio ?? 1.6)
  const coverHeight = 192 * effectiveSizeMultiplier
  const coverWidth = coverHeight / coverAspect
  const placeholderUrl = getPlaceholderCoverUrl()

  const media = libraryItem.media as LibraryItem['media']
  const hasCover = !!media.coverPath

  // Keep useMemo for computeProgress since it's an actual computation
  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: null, seriesProgressPercent, useSeriesProgress: true }), [seriesProgressPercent])

  const handleCardClick = () => {
    if (collapsedSeries) {
      router.push(`/library/${libraryItem.libraryId}/series/${collapsedSeries.id}`)
    }
  }

  const displayTitle = (() => {
    if (!collapsedSeries) return '\u00A0'
    const ignorePrefix = orderBy === 'media.metadata.title' && sortingIgnorePrefix
    const name = ignorePrefix ? (collapsedSeries.nameIgnorePrefix ?? collapsedSeries.name) : collapsedSeries.name
    return name || '\u00A0'
  })()

  const displaySubtitle = !booksInSeries ? '\u00A0' : `${booksInSeries} ${t('LabelBooks')}`

  const titleCleaned = (() => {
    const title = collapsedSeries?.name || ''
    return title.length > 60 ? `${title.slice(0, 57)}...` : title
  })()

  const isAlternativeBookshelfView = bookshelfView === BookshelfView.DETAIL

  const renderBadges = () => {
    // Series sequence list badge (brown background, highest priority)
    if (seriesSequenceList) {
      return (
        <div
          cy-id="seriesSequenceList"
          className="absolute rounded-lg bg-amber-900 shadow-modal-content z-20 text-end top-[0.375em] end-[0.375em]"
          style={{ padding: '0.1em 0.25em' }}
        >
          <p style={{ fontSize: '0.8em' }}>#{seriesSequenceList}</p>
        </div>
      )
    }

    // Books in series badge (gold background)
    if (booksInSeries) {
      return (
        <div
          cy-id="booksInSeries"
          className="absolute rounded-lg bg-yellow-600/90 shadow-modal-content z-20 top-[0.375em] end-[0.375em]"
          style={{ padding: '0.1em 0.25em' }}
        >
          <p style={{ fontSize: '0.8em' }}>{booksInSeries}</p>
        </div>
      )
    }
    return null
  }

  const renderSeriesNameOverlay = (hovering: boolean) => {
    // Series name overlay when hovering over collapsed series
    if (hovering && seriesName) {
      return (
        <div
          cy-id="seriesNameOverlay"
          className="w-full h-full absolute top-0 start-0 z-10 bg-black/60 rounded-sm flex items-center justify-center"
          style={{ padding: '1em' }}
        >
          <p className="text-gray-200 text-center" style={{ fontSize: '1.1em' }}>
            {seriesName}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <MediaCardFrame
      width={coverWidth}
      height={coverHeight}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      cardId={cardId}
      cy-id="collapsedSeriesCard"
      footer={
        isAlternativeBookshelfView && (
          <MediaCardDetailView
            displayTitle={displayTitle}
            displaySubtitle={displaySubtitle}
            displayLineTwo=""
            isExplicit={false}
            showSubtitles={showSubtitles}
            orderBy={orderBy}
            libraryItem={libraryItem}
            media={media}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            locale={locale}
            lastUpdated={lastUpdated}
            startedAt={startedAt}
            finishedAt={finishedAt}
          />
        )
      }
      cover={
        <MediaCardCover
          libraryItem={libraryItem}
          coverAspect={coverAspect}
          placeholderUrl={placeholderUrl}
          hasCover={hasCover}
          title={collapsedSeries?.name || ''}
          titleCleaned={titleCleaned}
          authorCleaned=""
          isPodcast={false}
          userProgressPercent={userProgressPercent}
          itemIsFinished={itemIsFinished}
        />
      }
      overlay={
        <MediaCardOverlay
          isHovering={isHovering}
          isSelectionMode={isSelectionMode}
          selected={selected}
          processing={false}
          isPending={false}
          isMoreMenuOpen={false}
          showPlayButton={false}
          showReadButton={false}
          userCanUpdate={false}
          playIconFontSize={0}
          moreMenuItems={[]}
          rssFeed={null}
          mediaItemShare={null}
          showError={false}
          errorText=""
          showSelectRadioButton={false}
          renderOverlayBadges={undefined}
          renderBadges={renderBadges}
          renderSeriesNameOverlay={renderSeriesNameOverlay}
          onPlay={() => {}}
          onRead={() => {}}
          onMoreAction={() => {}}
          onMoreMenuOpenChange={() => {}}
          onSelect={onSelect}
        />
      }
    />
  )
}
