'use client'

import Dropdown from '@/components/ui/Dropdown'
import { useComponentsCatalog } from '@/contexts/ComponentsCatalogContext'
import { LibraryProvider } from '@/contexts/LibraryContext'
import { FlatResultItem } from '@/hooks/useGlobalSearchTransformer'
import { Author, BookLibraryItem, Collection, LibraryItem, Playlist, PodcastLibraryItem, Series } from '@/types/api'
import { useCallback, useState } from 'react'
import GlobalSearchInput from '../../GlobalSearchInput'
import { BookDetailsEditExamples } from '../examples/BookDetailsEditExamples'
import { ChaptersExamples } from '../examples/ChaptersExamples'
import { CoverEditExamples } from '../examples/CoverEditExamples'
import { FilesExamples } from '../examples/FilesExamples'
import { MatchExamples } from '../examples/MatchExamples'
import { MediaCardExamples } from '../examples/MediaCardExamples'
import { PodcastDetailsEditExamples } from '../examples/PodcastDetailsEditExamples'
import { PreviewCoverExamples } from '../examples/PreviewCoverExamples'
import { ToolsExamples } from '../examples/ToolsExamples'

export default function ItemDetailsExamplesPage() {
  const { libraries } = useComponentsCatalog()
  const [selectedLibraryId, setSelectedLibraryId] = useState(libraries[0]?.id || '')
  const [selectedBook, setSelectedBook] = useState<BookLibraryItem | null>(null)
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastLibraryItem | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<{ series: Series; books: LibraryItem[] } | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)

  const handleItemSelect = useCallback(async (item: FlatResultItem) => {
    // Clear all selections first
    setSelectedBook(null)
    setSelectedPodcast(null)
    setSelectedCollection(null)
    setSelectedPlaylist(null)
    setSelectedSeries(null)
    setSelectedAuthor(null)

    // Set the appropriate selection based on item type
    switch (item.type) {
      case 'book':
        setSelectedBook(item.originalItem as BookLibraryItem)
        break
      case 'podcast':
        setSelectedPodcast(item.originalItem as PodcastLibraryItem)
        break
      case 'collection':
        setSelectedCollection(item.originalItem as Collection)
        break
      case 'playlist':
        setSelectedPlaylist(item.originalItem as Playlist)
        break
      case 'series':
        // Series originalItem now contains books (from transformer)
        const series = item.originalItem as Series
        setSelectedSeries({ series, books: series.books || [] })
        break
      case 'author':
        setSelectedAuthor(item.originalItem as Author)
        break
    }
  }, [])

  const handleClear = useCallback(() => {
    setSelectedBook(null)
    setSelectedPodcast(null)
    setSelectedCollection(null)
    setSelectedPlaylist(null)
    setSelectedSeries(null)
    setSelectedAuthor(null)
  }, [])

  return (
    <LibraryProvider bookshelfView={0} library={libraries.find((l) => l.id === selectedLibraryId)}>
      <div className="p-8 w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Item Details & Cover Examples</h1>
          <p className="text-gray-300 mb-6">
            This page showcases the item details editing components and cover management components for library items. Use the search box below to find and
            select books or podcasts to see the relevant components in action with real data.
          </p>
          <a href="/components_catalog" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Components Catalog
          </a>
        </div>

        {/* Search Section */}
        <section className="mb-12">
          <div className="mb-6 p-4 bg-bg/50 rounded-lg border border-primary/10">
            <h3 className="text-lg font-semibold mb-4">Search Library Items</h3>
            <p className="text-sm text-gray-400 mb-4">Use the search input to find items. Click on a result to select it for viewing below.</p>
            <div className="flex items-center gap-3">
              <Dropdown
                items={libraries.map((lib) => ({ text: lib.name, value: lib.id }))}
                value={selectedLibraryId}
                onChange={(value) => setSelectedLibraryId(String(value))}
                size="small"
                className="w-48"
                usePortal
              />
              <div className="flex-1">
                <GlobalSearchInput onItemSelect={handleItemSelect} onClear={handleClear} libraryId={selectedLibraryId} usePortal />
              </div>
            </div>

            {/* Show current selection */}
            {(selectedBook || selectedPodcast || selectedCollection || selectedPlaylist || selectedSeries || selectedAuthor) && (
              <div className="mt-4 text-sm text-gray-400">
                Selected:{' '}
                <strong className="text-foreground">
                  {selectedBook?.media.metadata.title ||
                    selectedPodcast?.media.metadata.title ||
                    selectedCollection?.name ||
                    selectedPlaylist?.name ||
                    selectedSeries?.series.name ||
                    selectedAuthor?.name}
                </strong>
              </div>
            )}
          </div>
        </section>

        {/* Table of Contents - Only show when there's a selected item */}
        {(selectedBook || selectedPodcast || selectedSeries || selectedCollection || selectedPlaylist || selectedAuthor) && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-400">Table of Contents</h2>
            <div className="bg-gray-800 p-6 rounded-lg">
              <ul className="space-y-2 text-gray-300">
                {selectedBook && (
                  <>
                    <li>
                      <a href="#book-details-edit-examples" className="hover:text-blue-400 transition-colors">
                        Book Details Edit
                      </a>
                    </li>
                    <li>
                      <a href="#chapters-examples" className="hover:text-blue-400 transition-colors">
                        Chapters
                      </a>
                    </li>
                    <li>
                      <a href="#files-examples" className="hover:text-blue-400 transition-colors">
                        Files
                      </a>
                    </li>
                    <li>
                      <a href="#tools-examples" className="hover:text-blue-400 transition-colors">
                        Tools
                      </a>
                    </li>
                  </>
                )}
                {selectedPodcast && (
                  <>
                    <li>
                      <a href="#podcast-details-edit-examples" className="hover:text-blue-400 transition-colors">
                        Podcast Details Edit
                      </a>
                    </li>
                    <li>
                      <a href="#files-examples" className="hover:text-blue-400 transition-colors">
                        Files
                      </a>
                    </li>
                  </>
                )}
                {(selectedBook || selectedPodcast) && (
                  <>
                    <li>
                      <a href="#cover-examples" className="hover:text-blue-400 transition-colors">
                        Cover Edit
                      </a>
                    </li>
                    <li>
                      <a href="#match-examples" className="hover:text-blue-400 transition-colors">
                        Match
                      </a>
                    </li>
                    <li>
                      <a href="#preview-cover-examples" className="hover:text-blue-400 transition-colors">
                        Preview Cover
                      </a>
                    </li>
                  </>
                )}
                {selectedBook && (
                  <li>
                    <a href="#media-card-examples" className="hover:text-blue-400 transition-colors">
                      Book Media Cards
                    </a>
                  </li>
                )}
                {selectedPodcast && (
                  <li>
                    <a href="#media-card-examples" className="hover:text-blue-400 transition-colors">
                      Podcast Media Cards
                    </a>
                  </li>
                )}
                {selectedSeries && (
                  <li>
                    <a href="#series-card-examples" className="hover:text-blue-400 transition-colors">
                      Series Cards
                    </a>
                  </li>
                )}
                {selectedCollection && (
                  <li>
                    <a href="#collection-card-examples" className="hover:text-blue-400 transition-colors">
                      Collection Cards
                    </a>
                  </li>
                )}
                {selectedPlaylist && (
                  <li>
                    <a href="#playlist-card-examples" className="hover:text-blue-400 transition-colors">
                      Playlist Cards
                    </a>
                  </li>
                )}
                {selectedAuthor && (
                  <li>
                    <a href="#author-card-examples" className="hover:text-blue-400 transition-colors">
                      Author Cards
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </section>
        )}

        {/* Book Details Edit - Only show when a book is selected */}
        {selectedBook && (
          <div id="book-details-edit-examples">
            <BookDetailsEditExamples selectedBook={selectedBook} />
          </div>
        )}

        {/* Chapters - Only show when a book is selected */}
        {selectedBook && (
          <div id="chapters-examples">
            <ChaptersExamples selectedBook={selectedBook} />
          </div>
        )}

        {/* Podcast Details Edit - Only show when a podcast is selected */}
        {selectedPodcast && (
          <div id="podcast-details-edit-examples">
            <PodcastDetailsEditExamples selectedPodcast={selectedPodcast} />
          </div>
        )}

        {/* Files - Show when a book or podcast is selected */}
        {(selectedBook || selectedPodcast) && (
          <div id="files-examples">
            <FilesExamples selectedBook={selectedBook} selectedPodcast={selectedPodcast} />
          </div>
        )}

        {selectedBook && (
          <div id="cover-examples">
            <CoverEditExamples selectedLibraryItem={selectedBook} />
          </div>
        )}

        {selectedPodcast && (
          <div id="cover-examples">
            <CoverEditExamples selectedLibraryItem={selectedPodcast} />
          </div>
        )}

        {(selectedBook || selectedPodcast) && (
          <div id="match-examples">
            <MatchExamples selectedLibraryItem={selectedBook ?? selectedPodcast ?? undefined} />
          </div>
        )}

        {selectedBook && (
          <div id="tools-examples">
            <ToolsExamples selectedBook={selectedBook} />
          </div>
        )}

        {(selectedBook || selectedPodcast) && (
          <div id="preview-cover-examples">
            <PreviewCoverExamples selectedBook={selectedBook} selectedPodcast={selectedPodcast} />
          </div>
        )}

        {(selectedBook || selectedPodcast || selectedSeries || selectedCollection || selectedPlaylist || selectedAuthor) && (
          <div id="media-card-examples">
            <MediaCardExamples
              selectedBook={selectedBook}
              selectedPodcast={selectedPodcast}
              selectedSeries={selectedSeries}
              selectedCollection={selectedCollection}
              selectedPlaylist={selectedPlaylist}
              selectedAuthor={selectedAuthor}
            />
          </div>
        )}
      </div>
    </LibraryProvider>
  )
}
