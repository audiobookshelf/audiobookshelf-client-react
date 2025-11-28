'use client'

import MediaCardCover from '@/components/widgets/media-card/MediaCardCover'
import MediaCardOverlay from '@/components/widgets/media-card/MediaCardOverlay'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getCoverAspectRatio, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { computeProgress } from '@/lib/mediaProgress'
import type { LibraryItem } from '@/types/api'
import { BookshelfView } from '@/types/api'
import { useRouter } from 'next/navigation'
import { useCallback, useId, useMemo, useState } from 'react'
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
    sizeMultiplier = 1,
    dateFormat,
    timeFormat,
    showSubtitles,
    isSelectionMode = false,
    selected = false,
    onSelect
  } = props

  const t = useTypeSafeTranslations()
  const router = useRouter()
  const cardId = useId()

  const [isHovering, setIsHovering] = useState(false)

  const collapsedSeries = useMemo(() => libraryItem.collapsedSeries, [libraryItem])

  const booksInSeries = useMemo(() => collapsedSeries?.numBooks || 0, [collapsedSeries])
  const seriesSequenceList = useMemo(() => collapsedSeries?.seriesSequenceList || null, [collapsedSeries])
  const seriesName = useMemo(() => collapsedSeries?.name || null, [collapsedSeries])

  const coverAspect = useMemo(() => getCoverAspectRatio(bookCoverAspectRatio ?? 1.6), [bookCoverAspectRatio])
  const coverHeight = useMemo(() => 192 * (sizeMultiplier || 1), [sizeMultiplier])
  const coverWidth = useMemo(() => coverHeight / coverAspect, [coverHeight, coverAspect])
  const placeholderUrl = useMemo(() => getPlaceholderCoverUrl(), [])

  const media = libraryItem.media as LibraryItem['media']
  const hasCover = useMemo(() => !!(media as { coverPath?: string }).coverPath, [media])

  const {
    percent: userProgressPercent,
    isFinished: itemIsFinished,
    lastUpdated,
    startedAt,
    finishedAt
  } = useMemo(() => computeProgress({ progress: null, seriesProgressPercent, useSeriesProgress: true }), [seriesProgressPercent])

  const handleCardClick = useCallback(() => {
    if (collapsedSeries) {
      router.push(`/library/${libraryItem.libraryId}/series/${collapsedSeries.id}`)
    }
  }, [collapsedSeries, libraryItem.libraryId, router])

  const displayTitle = useMemo(() => {
    if (!collapsedSeries) return '\u00A0'
    const ignorePrefix = orderBy === 'media.metadata.title' && sortingIgnorePrefix
    const name = ignorePrefix ? (collapsedSeries.nameIgnorePrefix ?? collapsedSeries.name) : collapsedSeries.name
    return name || '\u00A0'
  }, [collapsedSeries, orderBy, sortingIgnorePrefix])

  const displaySubtitle = useMemo(() => {
    if (!booksInSeries) return '\u00A0'
    return `${booksInSeries} ${t('LabelBooks')}`
  }, [booksInSeries, t])

  const titleCleaned = useMemo(() => {
    const title = collapsedSeries?.name || ''
    if (title.length > 60) {
      return `${title.slice(0, 57)}...`
    }
    return title
  }, [collapsedSeries?.name])

  const isAlternativeBookshelfView = useMemo(() => bookshelfView === BookshelfView.DETAIL, [bookshelfView])

  const renderBadges = useMemo(() => {
    const SeriesBadges = () => {
      // Series sequence list badge (brown background, highest priority)
      if (seriesSequenceList) {
        return (
          <div
            cy-id="seriesSequenceList"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-20 text-end top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em`, backgroundColor: '#78350f' }}
          >
            <p style={{ fontSize: `${0.8}em` }}>#{seriesSequenceList}</p>
          </div>
        )
      }

      // Books in series badge (gold background)
      if (booksInSeries) {
        return (
          <div
            cy-id="booksInSeries"
            className="absolute rounded-lg bg-black/90 box-shadow-md z-20 top-[0.375em] end-[0.375em]"
            style={{ padding: `0.1em 0.25em`, backgroundColor: '#cd9d49dd' }}
          >
            <p style={{ fontSize: `${0.8}em` }}>{booksInSeries}</p>
          </div>
        )
      }
      return null
    }
    SeriesBadges.displayName = 'SeriesBadges'
    return SeriesBadges
  }, [booksInSeries, seriesSequenceList])

  const renderSeriesNameOverlay = useMemo(() => {
    const SeriesNameOverlay = (isHovering: boolean) => {
      // Series name overlay when hovering over collapsed series
      if (isHovering && seriesName) {
        return (
          <div
            cy-id="seriesNameOverlay"
            className="w-full h-full absolute top-0 start-0 z-10 bg-black/60 rounded-sm flex items-center justify-center"
            style={{ padding: `${1}em` }}
          >
            <p className="text-gray-200 text-center" style={{ fontSize: `${1.1}em` }}>
              {seriesName}
            </p>
          </div>
        )
      }
      return null
    }
    SeriesNameOverlay.displayName = 'SeriesNameOverlay'
    return SeriesNameOverlay
  }, [seriesName])

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
            lastUpdated={lastUpdated}
            startedAt={startedAt}
            finishedAt={finishedAt}
          />
        )
      }
      cover={
        <MediaCardCover
          libraryItem={libraryItem}
          coverWidth={coverWidth}
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
          isAuthorBookshelfView={false}
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
