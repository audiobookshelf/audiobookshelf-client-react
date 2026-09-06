'use client'

import AuthorLinks from '@/components/widgets/AuthorLinks'
import { useDomMarquee } from '@/hooks/useDomMarquee'
import { formatList } from '@/lib/formatList'
import { MARQUEE_LOOP_GAP_SPACES } from '@/lib/player/domWrappingMarquee'
import { useLocale } from 'next-intl'
import { memo, useMemo, useRef } from 'react'

interface PlayerMarqueeAuthorLineProps {
  libraryId: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  onNavigate?: () => void
}

function PlayerAuthorNames({ libraryId, bookAuthors, podcastAuthor, onNavigate, tabIndex }: PlayerMarqueeAuthorLineProps & { tabIndex?: number }) {
  if (bookAuthors.length > 0) {
    return <AuthorLinks libraryId={libraryId} authors={bookAuthors} onNavigate={onNavigate} tabIndex={tabIndex} prefetch={false} />
  }
  return <span>{podcastAuthor}</span>
}

function PlayerMarqueeAuthorLine({ libraryId, bookAuthors, podcastAuthor, onNavigate }: PlayerMarqueeAuthorLineProps) {
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const loopCopyRef = useRef<HTMLSpanElement>(null)
  const text = useMemo(() => {
    if (podcastAuthor) return podcastAuthor
    if (bookAuthors.length === 0) return ''
    return formatList(
      bookAuthors.map((author) => author.name),
      locale
    )
  }, [bookAuthors, locale, podcastAuthor])
  const authorsKey = useMemo(() => bookAuthors.map((author) => author.id).join(','), [bookAuthors])

  useDomMarquee(containerRef, trackRef, segmentRef, loopCopyRef, [libraryId, authorsKey, podcastAuthor, text])

  return (
    <div ref={containerRef} className="player-author-marquee relative min-w-0 flex-1 overflow-hidden" title={text}>
      <div ref={trackRef} className="w-max max-w-none whitespace-nowrap will-change-transform">
        <span ref={segmentRef} className="inline-block whitespace-nowrap">
          <PlayerAuthorNames libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={onNavigate} />
        </span>
        <span className="pointer-events-none whitespace-pre" aria-hidden>
          {'\u00A0'.repeat(MARQUEE_LOOP_GAP_SPACES)}
        </span>
        <span ref={loopCopyRef} className="inline-block whitespace-nowrap" aria-hidden>
          <PlayerAuthorNames libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={onNavigate} tabIndex={-1} />
        </span>
      </div>
    </div>
  )
}

export default memo(PlayerMarqueeAuthorLine)
