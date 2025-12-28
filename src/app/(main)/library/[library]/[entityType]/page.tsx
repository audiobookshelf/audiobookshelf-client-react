import { getCurrentUser } from '@/lib/api'
import { EntityType } from '@/types/api'

import BookshelfClient from './BookshelfClient'

export default async function EntityPage({ params }: { params: Promise<{ library: string; entityType: string }> }) {
  const { entityType: entityTypeString } = await params
  const entityType = entityTypeString as EntityType

  // 1. Fetch user data
  const currentUser = await getCurrentUser()

  if (!currentUser?.user) {
    // Check handled in layout usually, but safe to keep
  }

  return (
    <div className="w-full h-full">
      <BookshelfClient key={entityType} entityType={entityType} currentUser={currentUser} />
    </div>
  )
}
