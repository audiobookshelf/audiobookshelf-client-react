import { getCurrentUser, getData } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import { userCanUpload } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import UploadClient from './UploadClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfUpload')
}

export default async function UploadPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user || !userCanUpload(currentUser.user)) {
    redirect(`/library/${libraryId}`)
  }

  return <UploadClient />
}
