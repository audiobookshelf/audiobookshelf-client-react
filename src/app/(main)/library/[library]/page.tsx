import LibraryDataFetcher from './LibraryServer'

export default async function LibraryPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="w-full">
      <LibraryDataFetcher libraryId={libraryId} />
    </div>
  )
}
