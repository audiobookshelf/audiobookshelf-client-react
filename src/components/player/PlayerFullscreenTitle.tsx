'use client'

import { navigateAfterFullscreenClose } from '@/hooks/usePlayerFullscreenHistory'
import type { LibraryItem } from '@/types/api'
import Link from 'next/link'
import { useFormatter } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'
import type { PlayerMetadataDisplay } from './PlayerMetadataBlock'

interface PlayerFullscreenTitleProps {
  streamLibraryItem: LibraryItem
  metadata: PlayerMetadataDisplay
  /** Leaves fullscreen when a link is followed, so the destination is not left behind the overlay */
  onNavigate: () => void
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

export default function PlayerFullscreenTitle({ streamLibraryItem, metadata, onNavigate }: PlayerFullscreenTitleProps) {
  const format = useFormatter()

  const authorLinks =
    metadata.bookAuthors.length > 0
      ? metadata.bookAuthors.map((author) => (
          <FullscreenExitLink
            key={author.id}
            href={`/library/${streamLibraryItem.libraryId}/authors/${author.id}`}
            onNavigate={onNavigate}
            className="hover:underline"
          >
            {author.name}
          </FullscreenExitLink>
        ))
      : null

  return (
    <div className="w-full min-w-0 text-center">
      <FullscreenExitLink
        href={`/library/${streamLibraryItem.libraryId}/item/${streamLibraryItem.id}`}
        onNavigate={onNavigate}
        className="block truncate text-xl font-bold hover:underline sm:text-2xl"
      >
        {metadata.displayTitle}
      </FullscreenExitLink>
      {metadata.podcastAuthor ? (
        <p className="text-foreground-muted mt-1 truncate text-base">{metadata.podcastAuthor}</p>
      ) : authorLinks ? (
        <p className="text-foreground-muted mt-1 truncate text-base">{format.list(authorLinks, { type: 'unit' })}</p>
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
