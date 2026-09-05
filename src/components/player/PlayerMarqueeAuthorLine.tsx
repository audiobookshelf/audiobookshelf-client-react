'use client'

import AuthorLinks from '@/components/widgets/AuthorLinks'
import { useDomMarquee } from '@/hooks/useDomMarquee'
import { formatList } from '@/lib/formatList'
import { useLocale } from 'next-intl'
import { memo, useMemo, useRef } from 'react'

interface PlayerMarqueeAuthorLineProps {
  libraryId: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  onNavigate?: () => void
}

function PlayerMarqueeAuthorLine({ libraryId, bookAuthors, podcastAuthor, onNavigate }: PlayerMarqueeAuthorLineProps) {
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLSpanElement>(null)
  const text = useMemo(() => {
    if (podcastAuthor) return podcastAuthor
    if (bookAuthors.length === 0) return ''
    return formatList(
      bookAuthors.map((author) => author.name),
      locale
    )
  }, [bookAuthors, locale, podcastAuthor])

  useDomMarquee(containerRef, trackRef, segmentRef, [libraryId, bookAuthors, podcastAuthor, text])

  return (
    <div ref={containerRef} className="player-author-marquee relative min-w-0 flex-1 overflow-hidden" title={text}>
      <div ref={trackRef} className="w-max max-w-none whitespace-nowrap will-change-transform">
        <span ref={segmentRef} className="inline-block whitespace-nowrap">
          {bookAuthors.length > 0 ? <AuthorLinks libraryId={libraryId} authors={bookAuthors} onNavigate={onNavigate} /> : <span>{podcastAuthor}</span>}
        </span>
      </div>
    </div>
  )
}

export default memo(PlayerMarqueeAuthorLine)
