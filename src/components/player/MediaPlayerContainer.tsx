'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { useCoverAccentColor } from '@/hooks/useCoverAccentColor'
import { useMediaSession } from '@/hooks/useMediaSession'
import { usePlayerChapterQueueNavigation } from '@/hooks/usePlayerChapterQueueNavigation'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { mergeClasses } from '@/lib/merge-classes'
import { BookMedia } from '@/types/api'
import Link from 'next/link'
import { CSSProperties, Fragment, useMemo } from 'react'
import PreviewCover from '../covers/PreviewCover'
import IconBtn from '../ui/IconBtn'
import PlayerControls from './PlayerControls'
import PlayerTrackBar from './PlayerTrackBar'

/** Keep in sync with the player container and ereader overlay inset when both are open. */
export const MEDIA_PLAYER_HEIGHT_CLASS = 'h-48 lg:h-40'
export const MEDIA_PLAYER_BOTTOM_INSET_CLASS = 'bottom-48 lg:bottom-40'

export default function MediaPlayerContainer() {
  const { streamLibraryItem, clearStreamMedia, playerHandler } = useMediaContext()

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, clearStreamMedia)

  const { handleNext, handlePrevious } = usePlayerChapterQueueNavigation(playerHandler, streamLibraryItem)

  useMediaSession({
    libraryItem: streamLibraryItem,
    playerHandler,
    onPreviousTrack: handlePrevious,
    onNextTrack: handleNext,
    enabled: !!streamLibraryItem
  })

  const coverPath = streamLibraryItem?.media?.coverPath
  const accentSourceUrl = useMemo(
    () => (streamLibraryItem && coverPath ? getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt, true) : null),
    [coverPath, streamLibraryItem]
  )
  const accentRgb = useCoverAccentColor(accentSourceUrl)

  const playerAccentStyle = useMemo((): CSSProperties | undefined => {
    if (!accentRgb) return undefined
    return { '--tc-player-accent-rgb': `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}` } as CSSProperties
  }, [accentRgb])

  // TODO: Set library in media context for streaming library item
  const coverAspectRatio = 1

  // Don't render the player if nothing is streaming
  if (!streamLibraryItem) {
    return null
  }

  // TODO: Get podcast episode duration
  const bookDuration = (streamLibraryItem.media as BookMedia).duration
  const bookAuthors = 'authors' in streamLibraryItem.media.metadata ? streamLibraryItem.media.metadata.authors || [] : []
  const displayTitle = playerHandler.state.displayTitle || streamLibraryItem.media.metadata.title

  return (
    <div
      className={mergeClasses(
        'bg-primary shadow-media-player fixed right-0 bottom-0 left-0 isolate z-50 w-full overflow-hidden px-2 pt-2 pb-1 lg:px-4 lg:pb-4',
        MEDIA_PLAYER_HEIGHT_CLASS
      )}
      style={playerAccentStyle}
    >
      {accentRgb !== null ? <div aria-hidden className="player-cover-accent-backdrop pointer-events-none absolute inset-0 z-0" /> : null}
      <div className="absolute top-2 left-2 z-[1] flex gap-4 lg:left-4">
        <PreviewCover
          src={getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt)}
          bookCoverAspectRatio={coverAspectRatio}
          showResolution={false}
          width={77}
        />
        <div className="flex flex-col gap-0.5">
          <Link href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`} className="text-foreground text-lg font-medium hover:underline">
            {displayTitle}
          </Link>
          {bookAuthors.length > 0 && (
            <div className="text-foreground-muted">
              {bookAuthors.map((author, index) => (
                <Fragment key={author.id}>
                  <Link href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`} className="text-foreground-muted hover:underline">
                    {author.name}
                  </Link>
                  {index < bookAuthors.length - 1 && <span className="text-foreground-muted">, </span>}
                </Fragment>
              ))}
            </div>
          )}
          {bookDuration && (
            <div className="text-foreground-muted flex items-center gap-1 text-sm">
              <span className="material-symbols text-foreground-muted text-sm">schedule</span>
              {secondsToTimestamp(bookDuration)}
            </div>
          )}
        </div>
      </div>
      <div className="relative z-[1] flex flex-col gap-3">
        <PlayerControls playerHandler={playerHandler} streamLibraryItem={streamLibraryItem} />

        <PlayerTrackBar playerHandler={playerHandler} />
      </div>

      <div className="absolute top-2 right-2 z-[1] flex items-center gap-1 lg:right-4">
        <IconBtn size="small" borderless onClick={clearStreamMedia}>
          close
        </IconBtn>
      </div>
    </div>
  )
}
