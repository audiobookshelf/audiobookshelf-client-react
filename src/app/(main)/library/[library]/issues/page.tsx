import { staticPageMetadata } from '@/lib/pageMetadata'
import type { Metadata } from 'next'
import BookshelfClient from '../[entityType]/BookshelfClient'

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata('TitleAudiobookshelfIssues')
}

export default function IssuesPage() {
  return (
    <div className="h-full w-full">
      <BookshelfClient entityType="items" />
    </div>
  )
}
