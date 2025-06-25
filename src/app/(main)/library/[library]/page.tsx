import Link from 'next/link'
import { Suspense } from 'react'
import LibraryClient from './LibraryClient'
import { getLibrary, getLibraryPersonalized } from '../../../../lib/api'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const libraryResponse = await Promise.all([getLibrary(libraryId), getLibraryPersonalized(libraryId)])
  const library = libraryResponse[0].data
  const personalized = libraryResponse[1].data

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-4">
        <Link href="/library" className="text-white">
          Back to libraries
        </Link>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <LibraryClient library={library} personalized={personalized} />
      </Suspense>
    </div>
  )
}
