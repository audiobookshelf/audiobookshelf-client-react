import Link from 'next/link'
import { Suspense } from 'react'
import LibrariesClient from './LibrariesClient'
import { getLibraries } from '../../../lib/api'

export const dynamic = 'force-dynamic'

export default async function Library() {
  const librariesResponse = await getLibraries()
  const libraries = librariesResponse.data?.libraries

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-4">
        <Link className="text-white" href="/">
          Back to home
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="mb-6 p-4 bg-primary rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        }
      >
        <LibrariesClient libraries={libraries} />
      </Suspense>
    </div>
  )
}
