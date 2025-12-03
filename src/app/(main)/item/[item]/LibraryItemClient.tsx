'use client'

import PreviewCover from '@/components/covers/PreviewCover'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import ChaptersTable from '@/components/widgets/ChaptersTable'
import LibraryFilesTable from '@/components/widgets/LibraryFilesTable'
import { getCoverAspectRatio, getLibraryItemCoverUrl } from '@/lib/coverUtils'
import { BookLibraryItem, BookMetadata, Library, PodcastLibraryItem, PodcastMetadata, UserLoginResponse } from '@/types/api'
import { Fragment } from 'react'
import LibraryItemDetails from './LibraryItemDetails'

interface LibraryItemClientProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  currentUser: UserLoginResponse
  library: Library
}

export default function LibraryItemClient({ libraryItem, currentUser, library }: LibraryItemClientProps) {
  const metadata = libraryItem.media.metadata as BookMetadata | PodcastMetadata
  const subtitle = 'subtitle' in metadata ? metadata.subtitle : undefined
  const bookAuthors = 'authors' in metadata ? metadata.authors || [] : []
  const bookSeries = 'series' in metadata ? metadata.series || [] : []
  const description = 'description' in metadata ? metadata.description : undefined

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
            {bookSeries.length > 0 && (
              <div>
                {bookSeries.map((series, index) => {
                  return (
                    <Fragment key={series.id}>
                      <a href={`/library/${library.id}/series/${series.id}`} className="text-foreground-muted hover:underline text-lg">
                        {series.name}
                        {series.sequence && <span className="text-foreground-muted text-lg"> #{series.sequence}</span>}
                      </a>
                      {index < bookSeries.length - 1 && <span className="text-foreground-muted text-lg">, </span>}
                    </Fragment>
                  )
                })}
              </div>
            )}

            {bookAuthors.length > 0 && (
              <div>
                {bookAuthors.map((author, index) => {
                  return (
                    <Fragment key={author.id}>
                      <a href={`/author/${author.id}`} className="text-foreground hover:underline text-lg md:text-xl">
                        {author.name}
                      </a>
                      {index < bookAuthors.length - 1 && <span className="text-foreground text-lg md:text-xl">, </span>}
                    </Fragment>
                  )
                })}
              </div>
            )}

            <LibraryItemDetails libraryItem={libraryItem} />

            <div className="flex items-center gap-2 mt-6">
              <Btn onClick={() => {}} color="bg-success" size="small">
                <span className="material-symbols fill text-xl mr-1">play_arrow</span>
                Play
              </Btn>
              <IconBtn onClick={() => {}} size="small">
                edit
              </IconBtn>
            </div>

            {description && <div className="mt-6" dangerouslySetInnerHTML={{ __html: description }} />}

            <div className="mt-20 flex flex-col gap-2">
              {/* chapters table */}
              {libraryItem.mediaType === 'book' && (libraryItem.media.chapters?.length ?? 0) > 0 && (
                <ChaptersTable libraryItem={libraryItem as BookLibraryItem} user={currentUser.user} />
              )}

              {/* library files table */}
              {(libraryItem.libraryFiles?.length ?? 0) > 0 && <LibraryFilesTable libraryItem={libraryItem} user={currentUser.user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
