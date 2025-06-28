import { Suspense } from 'react'
import LibraryClient from './LibraryClient'
import { getLibrary, getLibraryPersonalized } from '../../../../lib/api'
import StatusDataFetcher from '../../StatusDataFetcher'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const libraryResponse = await Promise.all([getLibrary(libraryId), getLibraryPersonalized(libraryId)])
  const library = libraryResponse[0].data
  const personalized = libraryResponse[1].data

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="mb-6 p-4 bg-primary rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Loading Status...</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        }
      >
        <StatusDataFetcher />
      </Suspense>
      <LibraryClient library={library} personalized={personalized} />
    </div>
  )
}
