'use client'

import PlayerMarqueeAuthorLine from './PlayerMarqueeAuthorLine'

interface PlayerAuthorLineProps {
  libraryId: string
  bookAuthors: { id: string; name: string }[]
  podcastAuthor: string | null
  onNavigate?: () => void
}

export default function PlayerAuthorLine({ libraryId, bookAuthors, podcastAuthor, onNavigate }: PlayerAuthorLineProps) {
  return <PlayerMarqueeAuthorLine libraryId={libraryId} bookAuthors={bookAuthors} podcastAuthor={podcastAuthor} onNavigate={onNavigate} />
}
