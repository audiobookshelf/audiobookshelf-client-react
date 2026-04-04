import { getCurrentUser, getData, getLibraryItem } from '@/lib/api'

export default async function TracksPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId), getCurrentUser())

  if (!libraryItem || !currentUser) {
    console.error('Error getting library item or user data')
    return null
  }

  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <div className="rounded border bg-black p-2">
        <pre className="overflow-x-auto text-sm whitespace-pre-wrap">{JSON.stringify(libraryItem, null, 2)}</pre>
      </div>
      <div className="rounded border bg-black p-2">
        <pre className="overflow-x-auto text-sm whitespace-pre-wrap">{JSON.stringify(currentUser, null, 2)}</pre>
      </div>
    </div>
  )
}
