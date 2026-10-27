import { getCurrentUser, getData } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import { userCanUpdate } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import BatchEditClient from './BatchEditClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfBatchEdit')
}

export default async function BatchEditPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user || !userCanUpdate(currentUser.user)) {
    redirect(`/library/${libraryId}`)
  }

  return (
    <div className="h-full w-full min-w-0">
      <BatchEditClient libraryId={libraryId} />
    </div>
  )
}
