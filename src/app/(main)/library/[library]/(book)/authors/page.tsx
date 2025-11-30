import { getAuthors, getData } from '@/lib/api'
import AuthorsClient from './AuthorsClient'

export default async function AuthorsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [authorsData] = await getData(getAuthors(libraryId))

  return (
    <div className="p-8 w-full">
      <AuthorsClient authorsData={authorsData} />
    </div>
  )
}
