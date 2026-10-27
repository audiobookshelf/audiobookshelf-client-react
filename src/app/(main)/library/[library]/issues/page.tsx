import { getCurrentUser, getData } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import BookshelfClient from '../[entityType]/BookshelfClient'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfIssues')
}

export default async function IssuesPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user || !isUserAdminOrUp(currentUser.user.type)) {
    redirect(`/library/${libraryId}`)
  }

  return (
    <div className="h-full w-full">
      <BookshelfClient entityType="items" />
    </div>
  )
}
