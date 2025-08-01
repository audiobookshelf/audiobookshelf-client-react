import { Suspense } from 'react'
import StatusDataFetcher from '../../StatusDataFetcher'
import LibraryDataFetcher from './LibraryServer'
import SuspenseFallback from '../../SuspenseFallback'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <Suspense>
        <StatusDataFetcher />
      </Suspense>
      <Suspense fallback={<SuspenseFallback />}>
        <LibraryDataFetcher libraryId={libraryId} />
      </Suspense>
    </div>
  )
}
