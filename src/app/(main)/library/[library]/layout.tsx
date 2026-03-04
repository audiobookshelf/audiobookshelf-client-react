import { LibraryProvider } from '@/contexts/LibraryContext'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getData, getLibraries } from '../../../../lib/api'
import AppBar from '../../AppBar'
import LibraryLayoutWrapper from './LibraryLayoutWrapper'

export const metadata: Metadata = {
  title: 'audiobookshelf',
  description: 'audiobookshelf'
}

export default async function LibraryLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ library: string }>
}>) {
  const { library: currentLibraryId } = await params

  const [librariesResponse] = await getData(getLibraries())

  const libraries = librariesResponse?.libraries || []
  const currentLibrary = libraries.find((library) => library.id === currentLibraryId)
  if (!currentLibrary) {
    console.error('Error getting library data')
    redirect(`/`)
  }

  return (
    <LibraryProvider library={currentLibrary}>
      <AppBar libraries={libraries} currentLibraryId={currentLibraryId} />
      <LibraryLayoutWrapper>{children}</LibraryLayoutWrapper>
    </LibraryProvider>
  )
}
