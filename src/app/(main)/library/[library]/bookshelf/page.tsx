import BookshelfServer from './BookshelfServer'

export default async function BookshelfPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="p-8 w-full">
      <BookshelfServer libraryId={libraryId} />
    </div>
  )
}
