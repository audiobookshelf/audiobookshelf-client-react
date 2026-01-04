'use client'

import { useMediaContext } from '@/contexts/MediaContext'
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

  // TODO: Set library in media context for streaming library item
  const coverAspectRatio = 1

  // Don't render the player if nothing is streaming
  if (!streamLibraryItem) {
    return null
  }

  // TODO: Get podcast episode duration
  const bookDuration = (streamLibraryItem.media as BookMedia).duration
  const bookAuthors = 'authors' in streamLibraryItem.media.metadata ? streamLibraryItem.media.metadata.authors || [] : []

  return (
    <div className="w-full fixed bottom-0 left-0 right-0 h-48 lg:h-40 z-50 bg-primary px-2 lg:px-4 pb-1 lg:pb-4 pt-2 shadow-media-player">
      <div className="absolute left-2 top-2 lg:left-4 flex gap-4">
        <PreviewCover
          src={getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt)}
          bookCoverAspectRatio={coverAspectRatio}
          showResolution={false}
          width={77}
        />
        <div className="flex flex-col gap-0.5">
          <Link href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`} className="text-lg font-medium hover:underline text-foreground">
            {streamLibraryItem.media.metadata.title}
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
            <div className="text-foreground-muted text-sm flex items-center gap-1">
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

      <div className="absolute right-2 top-2 lg:right-4 flex items-center gap-1">
        <IconBtn size="small" borderless onClick={clearStreamMedia}>
          close
        </IconBtn>
      </div>
    </div>
  )
}
