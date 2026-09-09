import { getData } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import { getAuthorOrNotFound } from '@/lib/notFound'
import type { Metadata } from 'next'
import AuthorClient from './AuthorClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfAuthors')
  }
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
