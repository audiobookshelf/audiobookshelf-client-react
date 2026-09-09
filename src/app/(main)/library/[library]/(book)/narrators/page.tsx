import { getData, getNarrators } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import type { Metadata } from 'next'
import NarratorsClient from './NarratorsClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTypeSafeTranslations()

  return {
    title: t('TitleAudiobookshelfNarrators')
  }
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
