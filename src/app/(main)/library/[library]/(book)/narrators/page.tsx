import { getData, getNarrators } from '@/lib/api'
import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import NarratorsClient from './NarratorsClient'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfNarrators')
}

export default async function NarratorsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [narrators] = await getData(getNarrators(libraryId))

  return (
    <div className="w-full p-4 md:p-8">
      <NarratorsClient libraryId={libraryId} narrators={narrators?.narrators ?? []} />
    </div>
  )
}
