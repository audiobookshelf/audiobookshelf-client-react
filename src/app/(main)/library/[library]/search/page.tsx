import { getData, searchLibrary } from '@/lib/api'
import { namedPageMetadata, staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import SearchClient from './SearchClient'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim()

  return query ? namedPageMetadata(query) : staticPageMetadata('TitleAudiobookshelfSearch')
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ library: string }>; searchParams: Promise<{ q?: string }> }) {
  const { library: libraryId } = await params
  const { q } = await searchParams
  const query = q?.trim()

  if (!query) {
    redirect(`/library/${libraryId}`)
  }

  const [results] = await getData(searchLibrary(libraryId, query))

  return (
    <div className="w-full">
      <SearchClient initialQuery={query} initialResults={results} />
    </div>
  )
}
