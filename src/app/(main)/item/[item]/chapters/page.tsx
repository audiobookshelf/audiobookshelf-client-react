import { getCurrentUser, getData, getLibraryItem } from '@/lib/api'

export default async function ChaptersPage({ params }: { params: Promise<{ item: string }> }) {
  const { item: itemId } = await params
  const [libraryItem, currentUser] = await getData(getLibraryItem(itemId), getCurrentUser())

  if (!libraryItem || !currentUser) {
    console.error('Error getting library item or user data')
    return null
  }

  return (
    <div className="p-8 w-full flex flex-col gap-4">
      <div className="bg-black p-2 rounded border">
        <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(libraryItem, null, 2)}</pre>
      </div>
      <div className="bg-black p-2 rounded border">
        <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(currentUser, null, 2)}</pre>
      </div>
    </div>
  )
}
