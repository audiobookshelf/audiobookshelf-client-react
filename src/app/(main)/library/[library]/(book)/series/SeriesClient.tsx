'use client'

import CoverSizeWidget from '@/components/widgets/CoverSizeWidget'
import { SeriesCard } from '@/components/widgets/media-card/SeriesCard'
import { BookshelfView, GetSeriesResponse, Library, UserLoginResponse } from '@/types/api'

interface SeriesClientProps {
  seriesData: GetSeriesResponse
  library: Library
  currentUser: UserLoginResponse
}

export default function SeriesClient({ seriesData, library, currentUser }: SeriesClientProps) {
  const seriesResults = seriesData.results
  const dateFormat = currentUser?.serverSettings?.dateFormat ?? 'MM/dd/yyyy'
  const libraryId = library.id

  console.log('currentUser', currentUser)

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {seriesResults.map((series) => {
          return (
            <SeriesCard
              key={series.id}
              series={series}
              libraryId={libraryId}
              bookshelfView={BookshelfView.DETAIL}
              dateFormat={dateFormat}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
            />
          )
        })}
      </div>
      <CoverSizeWidget className="absolute bottom-4 right-4 z-10" />
    </div>
  )
}
