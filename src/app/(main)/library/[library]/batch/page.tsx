import BatchEditClient from './BatchEditClient'

export const dynamic = 'force-dynamic'

export default async function BatchEditPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="h-full w-full min-w-0">
      <BatchEditClient libraryId={libraryId} />
    </div>
  )
}
