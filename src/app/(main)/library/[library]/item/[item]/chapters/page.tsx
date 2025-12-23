import { getCurrentUser, getData, getLibrary, getLibraryItem } from '@/lib/api'

export default async function ChaptersPage({ params }: { params: Promise<{ item: string; library: string }> }) {
  const { item: itemId, library: libraryId } = await params
  const [libraryItem, currentUser, library] = await getData(getLibraryItem(itemId), getCurrentUser(), getLibrary(libraryId))

  if (!libraryItem || !currentUser || !library) {
    console.error('Error getting library item or user or library data')
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
