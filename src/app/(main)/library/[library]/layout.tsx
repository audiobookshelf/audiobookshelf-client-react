import { LibraryProvider } from '@/contexts/LibraryContext'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getData, getLibraries } from '../../../../lib/api'
import AppBar from '../../AppBar'
import LibraryLayoutWrapper from './LibraryLayoutWrapper'
import LibrarySelectionLayout from './LibrarySelectionLayout'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelf'),
    description: 'Main page for audiobookshelf client'
  }
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
    redirect('/library')
  }

  return (
    <LibraryProvider library={currentLibrary}>
      <LibrarySelectionLayout>
        <AppBar libraries={libraries} currentLibraryId={currentLibraryId} />
        <LibraryLayoutWrapper>{children}</LibraryLayoutWrapper>
      </LibrarySelectionLayout>
    </LibraryProvider>
  )
}
