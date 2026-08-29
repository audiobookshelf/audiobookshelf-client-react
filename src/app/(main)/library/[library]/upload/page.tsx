import { getCurrentUser, getData } from '@/lib/api'
import { userCanUpload } from '@/lib/userPermissions'
import { redirect } from 'next/navigation'
import UploadClient from './UploadClient'

export const dynamic = 'force-dynamic'

export default async function UploadPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user || !userCanUpload(currentUser.user)) {
    redirect(`/library/${libraryId}`)
  }

  return <UploadClient />
}
