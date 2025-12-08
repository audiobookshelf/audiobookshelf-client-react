'use client'

import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { BookshelfView, GetSeriesResponse, Library, MediaProgress, UserLoginResponse } from '@/types/api'

interface SeriesClientProps {
  seriesData: GetSeriesResponse
  library: Library
  currentUser: UserLoginResponse
}

export default function SeriesClient({ seriesData, library, currentUser }: SeriesClientProps) {
  const seriesResults = seriesData.results
  const dateFormat = currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'
  const libraryId = library.id

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {seriesResults.map((series) => {
          const bookProgressMap = new Map<string, MediaProgress>()
          series.books?.forEach((libraryItem) => {
            const mediaProgress = currentUser.user.mediaProgress.find((mediaProgress) => mediaProgress.libraryItemId === libraryItem.id)
            if (mediaProgress) {
              bookProgressMap.set(libraryItem.id, mediaProgress)
            }
          })
          return (
            <SeriesCard
              key={series.id}
              series={series}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={dateFormat}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              bookProgressMap={bookProgressMap}
            />
          )
        })}
      </div>
    </div>
  )
}
