import { getCurrentUser, getData, getLibraries } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AddPodcastClient from './AddPodcastClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfAddPodcast')
}

export default async function AddPodcastPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [currentUser, librariesResponse] = await getData(getCurrentUser(), getLibraries())

  const isAdmin = currentUser?.user?.type === 'admin' || currentUser?.user?.type === 'root'
  if (!isAdmin) {
    redirect(`/library/${libraryId}`)
  }

  const library = librariesResponse?.libraries?.find((l) => l.id === libraryId)
  if (library?.mediaType === 'book') {
    redirect(`/library/${libraryId}`)
  }

  return <AddPodcastClient />
}
