'use client'

import { GetSeriesResponse } from '@/types/api'

interface SeriesClientProps {
  seriesData: GetSeriesResponse
}

export default function SeriesClient({ seriesData }: SeriesClientProps) {
  return (
    <div>
      <div className="mb-6 p-4 bg-primary rounded-lg">
        <pre className="text-sm bg-black p-2 rounded border whitespace-pre-wrap overflow-x-auto">{JSON.stringify(seriesData, null, 2)}</pre>
      </div>
    </div>
  )
}
