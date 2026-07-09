import { getData, getLibraryPersonalized, getLibraryStats } from '@/lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  const [[personalized], [stats]] = await Promise.all([getData(getLibraryPersonalized(libraryId)), getData(getLibraryStats(libraryId))])

  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return (
    <div className="w-full">
      <LibraryClient personalized={personalized} libraryItemCount={stats?.totalItems ?? 0} />
    </div>
  )
}
