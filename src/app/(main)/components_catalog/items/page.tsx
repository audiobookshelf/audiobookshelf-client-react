'use client'

import { LibrarySearchBox } from '@/components/widgets/LibrarySearchBox'
import { BookLibraryItem, PodcastLibraryItem } from '@/types/api'
import { useState } from 'react'
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
  const [selectedBook, setSelectedBook] = useState<BookLibraryItem | null>(null)
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastLibraryItem | null>(null)

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Item Details & Cover Examples</h1>
        <p className="text-gray-300 mb-6">
          This page showcases the item details editing components and cover management components for library items. Use the search box below to find and select
          books or podcasts to see the relevant components in action with real data.
        </p>
        <a href="/components_catalog" className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Components Catalog
        </a>
      </div>

      {/* Search Section */}
      <section className="mb-12">
        <LibrarySearchBox
          mediaTypes={['book', 'podcast']}
          onBookSelect={setSelectedBook}
          onPodcastSelect={setSelectedPodcast}
          onClear={() => {
            setSelectedBook(null)
            setSelectedPodcast(null)
          }}
        />
      </section>

      {/* Table of Contents - Only show when there's a selected item */}
      {(selectedBook || selectedPodcast) && (
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
              <li>
                <a href="#media-card-examples" className="hover:text-blue-400 transition-colors">
                  Media Cards
                </a>
              </li>
              <li>
                <a href="#series-card-examples" className="hover:text-blue-400 transition-colors">
                  Series Cards
                </a>
              </li>
              <li>
                <a href="#collection-card-examples" className="hover:text-blue-400 transition-colors">
                  Collection Cards
                </a>
              </li>
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

      {(selectedBook || selectedPodcast) && (
        <div id="media-card-examples">
          <MediaCardExamples selectedBook={selectedBook} selectedPodcast={selectedPodcast} />
        </div>
      )}
    </div>
  )
}
