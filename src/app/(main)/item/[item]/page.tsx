import { getData, getLibraryItem } from '../../../../lib/api'

export default async function ItemPage({ params }: { params: Promise<{ item: string }> }) {
  const { item: itemId } = await params
  const [libraryItem] = await getData(getLibraryItem(itemId))

  return (
    <div className="p-8 w-full">
      <div className="bg-black p-2 rounded border">
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(libraryItem, null, 2)}</pre>
      </div>
    </div>
  )
}
