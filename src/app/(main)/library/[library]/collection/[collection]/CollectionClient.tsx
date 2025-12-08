'use client'

import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { getCoverAspectRatio } from '@/lib/coverUtils'
import { Collection, Library } from '@/types/api'

interface CollectionClientProps {
  collection: Collection
  library: Library
}

export default function CollectionClient({ collection, library }: CollectionClientProps) {
  const coverAspectRatio = getCoverAspectRatio(library.settings?.coverAspectRatio ?? 1)
  const coverWidth = 120
  const coverHeight = coverWidth / coverAspectRatio

  return (
    <div>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <CollectionGroupCover books={collection.books ?? []} width={coverWidth * 2} height={coverHeight} bookCoverAspectRatio={coverAspectRatio} />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
          {collection.description && <p className="text-fg/70">{collection.description}</p>}
        </div>
      </div>
    </div>
  )
}
