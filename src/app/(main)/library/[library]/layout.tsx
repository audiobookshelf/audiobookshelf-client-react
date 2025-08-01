import type { Metadata } from 'next'
import { getLibraries } from '../../../../lib/api'
import '../../../../assets/globals.css'
import AppBar from '../../AppBar'

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

  const librariesResponse = await getLibraries()

  const libraries = librariesResponse.data?.libraries || []

  return (
    <>
      <AppBar libraries={libraries} currentLibraryId={currentLibraryId} />
      <div>{children}</div>
    </>
  )
}
