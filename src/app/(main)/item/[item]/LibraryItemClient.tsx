import PreviewCover from '@/components/covers/PreviewCover'
import ChaptersTable from '@/components/widgets/ChaptersTable'
import LibraryFilesTable from '@/components/widgets/LibraryFilesTable'
import { getCoverAspectRatio, getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { BookLibraryItem, BookMetadata, Library, PodcastLibraryItem, PodcastMetadata, UserLoginResponse } from '@/types/api'

interface LibraryItemClientProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  currentUser: UserLoginResponse
  library: Library
}

export default function LibraryItemClient({ libraryItem, currentUser, library }: LibraryItemClientProps) {
  const metadata = libraryItem.media.metadata as BookMetadata | PodcastMetadata
  const subtitle = 'subtitle' in metadata ? metadata.subtitle : undefined

  return (
    <div>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex gap-8">
          <div className="w-52 max-w-52">
            <PreviewCover
              src={getLibraryItemCoverUrl(libraryItem.id)}
              bookCoverAspectRatio={getCoverAspectRatio(library.settings?.coverAspectRatio)}
              showResolution={false}
              width={208}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-semibold">{libraryItem.media.metadata.title}</h1>
            {subtitle && <h2 className="text-xl md:text-2xl font-medium text-foreground-muted">{subtitle}</h2>}

            <div className="mt-20 flex flex-col gap-2">
              {/* chapters table */}
              {libraryItem.mediaType === 'book' && libraryItem.media.chapters.length > 0 && (
                <ChaptersTable libraryItem={libraryItem as BookLibraryItem} user={currentUser.user} />
              )}

              {/* library files table */}
              {libraryItem.libraryFiles.length > 0 && <LibraryFilesTable libraryItem={libraryItem} user={currentUser.user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
