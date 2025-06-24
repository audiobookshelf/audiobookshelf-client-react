import Link from 'next/link'
import { Suspense } from 'react'
import LibraryClient from './LibraryClient'
import { getLibrary } from '../../../../lib/api'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const libraryResponse = await getLibrary(libraryId)
  const library = libraryResponse.data

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-4">
        <Link href="/library" className="text-white">
          Back to libraries
        </Link>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <LibraryClient library={library} />
      </Suspense>
    </div>
  )
}
