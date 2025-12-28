'use client'

import PlaylistGroupCover from '@/components/widgets/media-card/PlaylistGroupCover'
import { useLibrary } from '@/contexts/LibraryContext'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { Playlist } from '@/types/api'

interface PlaylistClientProps {
  playlist: Playlist
}

export default function PlaylistClient({ playlist }: PlaylistClientProps) {
  const { library } = useLibrary()
  const coverAspectRatio = getCoverAspectRatio(library.settings?.coverAspectRatio ?? 1)
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  return (
    <div>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <PlaylistGroupCover items={playlist.items ?? []} width={coverWidth * 2} height={coverHeight * 2} bookCoverAspectRatio={coverAspectRatio} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
          {playlist.description && <p className="text-fg/70">{playlist.description}</p>}
        </div>
      </div>
    </div>
  )
}
