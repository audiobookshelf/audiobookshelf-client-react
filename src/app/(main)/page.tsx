import { Suspense } from 'react'
import StatusDataFetcher from './StatusDataFetcher'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Audiobookshelf!</h1>
      </div>

      <div className="mb-6 p-4 bg-primary rounded-lg flex justify-between items-center">
        <Link href="/library" className="text-white">
          Libraries
        </Link>
      </div>

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
    </div>
  )
}
