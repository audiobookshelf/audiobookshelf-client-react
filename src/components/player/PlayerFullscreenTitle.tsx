'use client'

import { navigateAfterFullscreenClose } from '@/hooks/usePlayerFullscreenHistory'
import { mergeClasses } from '@/lib/merge-classes'
import type { LibraryItem } from '@/types/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'
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

interface FullscreenExitLinkProps {
  href: string
  onNavigate: () => void
  className?: string
  children: ReactNode
}

function FullscreenExitLink({ href, onNavigate, className, children }: FullscreenExitLinkProps) {
  const router = useRouter()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // New tab / new window / non-primary button: leave this tab's fullscreen alone
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return

    event.preventDefault()
    navigateAfterFullscreenClose(onNavigate, () => router.push(href))
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}

export default function PlayerFullscreenTitle({ streamLibraryItem, metadata, onNavigate, compact = false }: PlayerFullscreenTitleProps) {
  return (
    <div className={mergeClasses('w-full min-w-0', compact ? 'text-start' : 'max-w-xl text-center')}>
      <FullscreenExitLink
        href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
        onNavigate={onNavigate}
        className={mergeClasses('block truncate font-bold hover:underline', compact ? 'text-base' : 'text-xl sm:text-2xl')}
      >
        {metadata.displayTitle}
      </FullscreenExitLink>
      {metadata.podcastAuthor ? (
        <p className={mergeClasses('text-foreground-muted truncate', compact ? 'text-sm' : 'mt-1 text-base')}>{metadata.podcastAuthor}</p>
      ) : metadata.bookAuthors.length > 0 ? (
        <p className={mergeClasses('text-foreground-muted truncate', compact ? 'text-sm' : 'mt-1 text-base')}>
          {metadata.bookAuthors.map((author, index) => (
            <span key={author.id}>
              <FullscreenExitLink href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`} onNavigate={onNavigate} className="hover:underline">
                {author.name}
              </FullscreenExitLink>
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
