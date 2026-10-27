import { getCurrentUser, getData, getLibraryStats } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import { isUserAdminOrUp } from '@/lib/userPermissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import StatsClient from './StatsClient'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfStats')
}

export default async function StatsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser] = await getData(getCurrentUser())

  if (!currentUser?.user || !isUserAdminOrUp(currentUser.user.type)) {
    redirect(`/library/${libraryId}`)
  }

  const [libraryStats] = await getData(getLibraryStats(libraryId))

  if (!libraryStats) {
    console.error('Error getting library stats')
    return null
  }

  return (
    <div className="w-full p-8">
      <StatsClient stats={libraryStats} />
    </div>
  )
}
