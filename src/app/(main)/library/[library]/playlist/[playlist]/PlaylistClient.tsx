'use client'

import PlaylistGroupCover from '@/components/widgets/media-card/PlaylistGroupCover'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { Playlist } from '@/types/api'

interface PlaylistClientProps {
  playlist: Playlist
}

export default function PlaylistClient({ playlist }: PlaylistClientProps) {
  const coverAspectRatio = useBookCoverAspectRatio()
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:items-start">
        <PlaylistGroupCover items={playlist.items ?? []} width={coverWidth * 2} height={coverHeight * 2} />
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-bold">{playlist.name}</h1>
          {playlist.description && <p className="text-foreground-muted">{playlist.description}</p>}
        </div>
      </div>
    </div>
  )
}
