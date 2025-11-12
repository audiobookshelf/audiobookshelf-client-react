import { getAuthor, getCurrentUser, getData, getLibrary } from '@/lib/api'
import AuthorClient from './AuthorClient'

export default async function AuthorPage({ params }: { params: Promise<{ author: string }> }) {
  const { author: authorId } = await params
  const [author, currentUser] = await getData(getAuthor(authorId), getCurrentUser())

  // TODO: Handle loading data error?
  if (!author || !currentUser) {
    console.error('Error getting author or user data')
    return null
  }

  const [library] = await getData(getLibrary(author.libraryId))

  // TODO: Handle loading data error?
  if (!library) {
    console.error('Error getting library data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <AuthorClient author={author} currentUser={currentUser} library={library} />
    </div>
  )
}
