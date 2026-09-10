import { getData } from '@/lib/api'
import { getAuthorOrNotFound } from '@/lib/notFound'
import { namedPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import AuthorClient from './AuthorClient'

export async function generateMetadata({ params }: { params: Promise<{ author: string; library: string }> }): Promise<Metadata> {
  const { author: authorId } = await params
  const [author] = await getData(getAuthorOrNotFound(authorId, 'include=items,series'))

  return namedPageMetadata(author.name)
}

export default async function AuthorPage({ params }: { params: Promise<{ author: string; library: string }> }) {
  const { author: authorId } = await params
  const [author] = await getData(getAuthorOrNotFound(authorId, 'include=items,series'))

  return (
    <div className="w-full p-8">
      <AuthorClient author={author} />
    </div>
  )
}
