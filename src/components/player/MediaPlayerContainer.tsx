'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { getLibraryItemCoverUrl } from '@/lib/coverUtils'
import PreviewCover from '../covers/PreviewCover'
import IconBtn from '../ui/IconBtn'

export default function MediaPlayerContainer() {
  const { streamLibraryItem, clearStreamMedia } = useMediaContext()
  // TODO: Set library in media context for streaming library item
  const coverAspectRatio = 1

  // Don't render the player if nothing is streaming
  if (!streamLibraryItem) {
    return null
  }

  return (
    <div className="w-full fixed bottom-0 left-0 right-0 h-48 lg:h-40 z-50 bg-primary px-2 lg:px-4 pb-1 lg:pb-4 pt-2 shadow-media-player">
      <div className="absolute left-2 top-2 lg:left-4 cursor-pointer">
        <PreviewCover
          src={getLibraryItemCoverUrl(streamLibraryItem.id, streamLibraryItem.updatedAt)}
          bookCoverAspectRatio={coverAspectRatio}
          showResolution={false}
          width={77}
        />
      </div>
      <div className="absolute right-2 top-2 lg:right-4 cursor-pointer">
        <IconBtn size="small" borderless onClick={clearStreamMedia}>
          close
        </IconBtn>
      </div>
    </div>
  )
}
