'use client'

import { PlaylistCard } from '@/components/widgets/media-card/PlaylistCard'
import { BookshelfView, GetPlaylistsResponse, Library, UserLoginResponse } from '@/types/api'

interface PlaylistsClientProps {
  playlistsData: GetPlaylistsResponse
  library: Library
  currentUser: UserLoginResponse
}

export default function PlaylistsClient({ playlistsData, library, currentUser }: PlaylistsClientProps) {
  const playlists = playlistsData.results
  const user = currentUser.user

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {playlists.map((playlist) => {
          return (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              userCanUpdate={user.permissions.update}
              userCanDelete={user.permissions.delete}
            />
          )
        })}
      </div>
    </div>
  )
}
