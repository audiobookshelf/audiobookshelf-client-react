import { getAuthor, getData } from '@/lib/api'
import AuthorClient from './AuthorClient'

export default async function AuthorPage({ params }: { params: Promise<{ author: string; library: string }> }) {
  const { author: authorId } = await params
  const [author] = await getData(getAuthor(authorId, 'include=items,series'))

  // TODO: Handle loading data error?
  if (!author) {
    console.error('Error getting author data')
    return null
  }

  return (
    <div className="p-8 w-full">
      <AuthorClient author={author} />
    </div>
  )
}
