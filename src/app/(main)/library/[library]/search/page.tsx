import { getData, searchLibrary } from '@/lib/api'
import { redirect } from 'next/navigation'
import SearchClient from './SearchClient'

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
