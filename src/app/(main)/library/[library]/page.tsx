import { Suspense } from 'react'
import SuspenseFallback from '../../SuspenseFallback'
import LibraryDataFetcher from './LibraryServer'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="w-full">
      <Suspense fallback={<SuspenseFallback />}>
        <LibraryDataFetcher libraryId={libraryId} />
      </Suspense>
    </div>
  )
}
