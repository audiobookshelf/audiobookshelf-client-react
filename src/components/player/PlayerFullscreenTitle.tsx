'use client'

import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import Link from 'next/link'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'

interface PlayerFullscreenTitleProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  /** Leaves fullscreen when a link is followed, so the destination is not left behind the overlay */
  onNavigate: () => void
  /**
   * Start-aligned and a size down, for the landscape layout — a phone held sideways has
   * roughly a third of the vertical room, and the title block is what has to give.
   */
  compact?: boolean
}

export default function PlayerFullscreenTitle({ streamLibraryItem, metadata, onNavigate, compact = false }: PlayerFullscreenTitleProps) {
  return (
    <div className={mergeClasses('w-full min-w-0', compact ? 'text-start' : 'max-w-xl text-center')}>
      <Link
        href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
        onClick={onNavigate}
        className={mergeClasses('block truncate font-bold hover:underline', compact ? 'text-base' : 'text-xl sm:text-2xl')}
      >
        {metadata.displayTitle}
      </Link>
      {metadata.podcastAuthor ? (
        <p className={mergeClasses('text-foreground-muted truncate', compact ? 'text-sm' : 'mt-1 text-base')}>{metadata.podcastAuthor}</p>
      ) : metadata.bookAuthors.length > 0 ? (
        <p className={mergeClasses('text-foreground-muted truncate', compact ? 'text-sm' : 'mt-1 text-base')}>
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
        <p className={mergeClasses('text-foreground-subdued flex items-center gap-1 font-mono', compact ? 'text-xs' : 'mt-1 justify-center text-sm')}>
          <span className="material-symbols text-xs" aria-hidden="true">
            schedule
          </span>
          {metadata.durationLabel}
        </p>
      )}
    </div>
  )
}
