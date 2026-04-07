import { getData, getLibraryPersonalized } from '@/lib/api'
import LibraryClient from './LibraryClient'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  const [personalized] = await getData(getLibraryPersonalized(libraryId))

  if (!personalized) {
    console.error('Error getting personalized data')
    return null
  }

  return (
    <div className="w-full">
      <LibraryClient personalized={personalized} />
    </div>
  )
}
