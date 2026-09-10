import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import BatchEditClient from './BatchEditClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfBatchEdit')
}

export default async function BatchEditPage({ params }: { params: Promise<{ library: string }> }) {
  const { library: libraryId } = await params

  return (
    <div className="h-full w-full min-w-0">
      <BatchEditClient libraryId={libraryId} />
    </div>
  )
}
