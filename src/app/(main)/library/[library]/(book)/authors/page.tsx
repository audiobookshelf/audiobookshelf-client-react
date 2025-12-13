import { getAuthors, getCurrentUser, getData } from '@/lib/api'
import AuthorsClient from './AuthorsClient'

export default async function AuthorsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [authorsData, currentUser] = await getData(getAuthors(libraryId), getCurrentUser())

  return (
    <div className="p-8 w-full">
      <AuthorsClient authorsData={authorsData} currentUser={currentUser} />
    </div>
  )
}
