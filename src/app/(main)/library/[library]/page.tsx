import { getData, getLibraries, getLibraryPersonalized, getLibraryStats } from '@/lib/api'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import LibraryClient from './LibraryClient'

export async function generateMetadata({ params }: { params: Promise<{ library: string }> }): Promise<Metadata> {
  const { library: libraryId } = await params
  const [librariesResponse] = await getData(getLibraries())
  const libraryName = librariesResponse?.libraries?.find((library) => library.id === libraryId)?.name

  return namedPageMetadata(libraryName, 'TitleAudiobookshelfHome')
}

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
