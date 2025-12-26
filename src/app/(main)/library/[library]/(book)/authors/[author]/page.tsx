import { getAuthor, getCurrentUser, getData, getLibrary } from '@/lib/api'
import AuthorClient from './AuthorClient'

export default async function AuthorPage({ params }: { params: Promise<{ author: string; library: string }> }) {
  const { author: authorId, library: libraryId } = await params
  const [author, currentUser, library] = await getData(getAuthor(authorId), getCurrentUser(), getLibrary(libraryId))

  // TODO: Handle loading data error?
  if (!author || !currentUser || !library) {
    console.error('Error getting author or user or library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <AuthorClient author={author} currentUser={currentUser} library={library} />
    </div>
  )
}
