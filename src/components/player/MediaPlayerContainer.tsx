'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useAudioPlayerHotkeys } from '@/hooks/useAudioPlayerHotkeys'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { secondsToTimestamp } from '@/lib/datefns'
import { BookMedia } from '@/types/api'
import Link from 'next/link'
import { Fragment } from 'react'
import PreviewCover from '../covers/PreviewCover'
import IconBtn from '../ui/IconBtn'
import PlayerControls from './PlayerControls'
import PlayerTrackBar from './PlayerTrackBar'

export default function MediaPlayerContainer() {
  const { streamLibraryItem, clearStreamMedia, playerHandler } = useMediaContext()

  useAudioPlayerHotkeys(playerHandler.state, playerHandler.controls, !!streamLibraryItem, clearStreamMedia)

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
    <div className="bg-primary shadow-media-player fixed right-0 bottom-0 left-0 z-50 h-48 w-full px-2 pt-2 pb-1 lg:h-40 lg:px-4 lg:pb-4">
      <div className="absolute top-2 left-2 flex gap-4 lg:left-4">
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
      <div className="flex flex-col gap-3">
        <PlayerControls playerHandler={playerHandler} />

        <PlayerTrackBar playerHandler={playerHandler} />
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 lg:right-4">
        <IconBtn size="small" borderless onClick={clearStreamMedia}>
          close
        </IconBtn>
      </div>
    </div>
  )
}
