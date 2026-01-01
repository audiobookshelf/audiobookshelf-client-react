import { getAuthor, getCurrentUser, getData } from '@/lib/api'
import AuthorClient from './AuthorClient'

export default async function AuthorPage({ params }: { params: Promise<{ author: string; library: string }> }) {
  const { author: authorId } = await params
  const [author, currentUser] = await getData(getAuthor(authorId, 'include=items,series'), getCurrentUser())

  // TODO: Handle loading data error?
  if (!author || !currentUser) {
    console.error('Error getting author or user data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <AuthorClient author={author} currentUser={currentUser} />
    </div>
  )
}
