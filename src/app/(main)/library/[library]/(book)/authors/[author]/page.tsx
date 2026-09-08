import { getData } from '@/lib/api'
import { getAuthorOrNotFound } from '@/lib/notFound'
import AuthorClient from './AuthorClient'

export default async function AuthorPage({ params }: { params: Promise<{ author: string; library: string }> }) {
  const { author: authorId } = await params
  const [author] = await getData(getAuthorOrNotFound(authorId, 'include=items,series'))

  return (
    <div className="w-full p-8">
      <AuthorClient author={author} />
    </div>
  )
}
