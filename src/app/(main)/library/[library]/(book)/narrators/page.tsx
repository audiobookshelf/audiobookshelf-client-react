import { getData, getNarrators } from '@/lib/api'
import NarratorsClient from './NarratorsClient'

export default async function NarratorsPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params
  const [narrators] = await getData(getNarrators(libraryId))

  return (
    <div className="p-8 w-full">
      <NarratorsClient libraryId={libraryId} narrators={narrators?.narrators ?? []} />
    </div>
  )
}
