'use client'

import { CollectionCard } from '@/components/widgets/media-card/CollectionCard'
import { BookshelfView, GetCollectionsResponse, Library, UserLoginResponse } from '@/types/api'

interface CollectionsClientProps {
  collectionsData: GetCollectionsResponse
  library: Library
  currentUser: UserLoginResponse
}

export default function CollectionsClient({ collectionsData, library, currentUser }: CollectionsClientProps) {
  const collections = collectionsData.results
  const user = currentUser.user

  return (
    <div>
      <div className="flex justify-center flex-wrap gap-4">
        {collections.map((collection) => {
          return (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bookshelfView={BookshelfView.DETAIL}
              bookCoverAspectRatio={library.settings?.coverAspectRatio ?? 1}
              userCanUpdate={user.permissions.update}
              userCanDelete={user.permissions.delete}
              userIsAdmin={user.type === 'admin' || user.type === 'root'}
            />
          )
        })}
      </div>
    </div>
  )
}
