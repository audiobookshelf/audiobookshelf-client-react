'use client'

import type { LibraryItem } from '@/types/api'
import Link from 'next/link'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'

interface PlayerFullscreenTitleProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  /** Leaves fullscreen when a link is followed, so the destination is not left behind the overlay */
  onNavigate: () => void
}

export default function PlayerFullscreenTitle({ streamLibraryItem, metadata, onNavigate }: PlayerFullscreenTitleProps) {
  return (
    <div className="w-full max-w-xl text-center">
      <Link
        href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
        onClick={onNavigate}
        className="block truncate text-xl font-bold hover:underline sm:text-2xl"
      >
        {metadata.displayTitle}
      </Link>
      {metadata.podcastAuthor ? (
        <p className="text-foreground-muted mt-1 truncate text-base">{metadata.podcastAuthor}</p>
      ) : metadata.bookAuthors.length > 0 ? (
        <p className="text-foreground-muted mt-1 truncate text-base">
          {metadata.bookAuthors.map((author, index) => (
            <span key={author.id}>
              <Link href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`} onClick={onNavigate} className="hover:underline">
                {author.name}
              </Link>
              {index < metadata.bookAuthors.length - 1 && <span>, </span>}
            </span>
          ))}
        </p>
      ) : null}
      {/* The track bars show elapsed and remaining, so total length would otherwise be missing */}
      {metadata.durationLabel && (
        <p className="text-foreground-subdued mt-1 flex items-center justify-center gap-1 font-mono text-sm">
          <span className="material-symbols text-xs" aria-hidden="true">
            schedule
          </span>
          {metadata.durationLabel}
        </p>
      )}
    </div>
  )
}
