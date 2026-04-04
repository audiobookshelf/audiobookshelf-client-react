import { getData, getNarrators } from '@/lib/api'
import NarratorsClient from './NarratorsClient'

export default async function NarratorsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [narrators] = await getData(getNarrators(libraryId))

  return (
    <div className="w-full p-8">
      <NarratorsClient libraryId={libraryId} narrators={narrators?.narrators ?? []} />
    </div>
  )
}
