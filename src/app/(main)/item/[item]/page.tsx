import { getLibraryItem, getData } from '../../../../lib/api'

export default async function ItemPage({ params }: { params: Promise<{ item: string }> }) {
  const { item: itemId } = await params
  const [itemResponse] = await getData(getLibraryItem(itemId))

  return (
    <div className="p-8 w-full">
      <div className="bg-black p-2 rounded border">
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(itemResponse.data, null, 2)}</pre>
      </div>
    </div>
  )
}
