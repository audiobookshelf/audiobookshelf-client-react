'use client'

import Marquee from '@/components/ui/Marquee'
import AuthorLinks from '@/components/widgets/AuthorLinks'
import { usePlayerShellLayout } from '@/hooks/usePlayerShellLayout'
import { mergeClasses } from '@/lib/merge-classes'
import { useLocale } from 'next-intl'
import { memo, useMemo } from 'react'

const PLAYER_AUTHOR_MARQUEE_MINI_CLASS = 'w-auto max-w-full flex-initial'
const PLAYER_AUTHOR_MARQUEE_FULLSCREEN_CLASS = 'w-full flex-1'

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
  const { isPlayerFullscreen } = usePlayerShellLayout()
  const locale = useLocale()
  const text = useMemo(() => {
    if (podcastAuthor) return podcastAuthor
    if (bookAuthors.length === 0) return ''
    return new Intl.ListFormat(locale, { type: 'unit' }).format(bookAuthors.map((author) => author.name))
  }, [bookAuthors, locale, podcastAuthor])

  return (
    <Marquee
      className={mergeClasses('player-author-marquee ps-1', isPlayerFullscreen ? PLAYER_AUTHOR_MARQUEE_FULLSCREEN_CLASS : PLAYER_AUTHOR_MARQUEE_MINI_CLASS)}
      title={text}
    >
      <PlayerAuthorNames libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={onNavigate} />
    </Marquee>
  )
}

export default memo(PlayerMarqueeAuthorLine)
