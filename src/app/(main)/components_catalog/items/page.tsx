import { BookDetailsEditExamples } from '../examples/BookDetailsEditExamples'
import { PodcastDetailsEditExamples } from '../examples/PodcastDetailsEditExamples'
import { PreviewCoverExamples } from '../examples/PreviewCoverExamples'

export default function ItemDetailsExamplesPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Item Details & Cover Examples</h1>
        <p className="text-gray-300 mb-6">This page showcases the item details editing components and cover management components for library items.</p>
        <a href="/components_catalog" className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Components Catalog
        </a>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Table of Contents</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#book-details-edit-examples" className="hover:text-blue-400 transition-colors">
                Book Details Edit
              </a>
            </li>
            <li>
              <a href="#podcast-details-edit-examples" className="hover:text-blue-400 transition-colors">
                Podcast Details Edit
              </a>
            </li>
            <li>
              <a href="#preview-cover-examples" className="hover:text-blue-400 transition-colors">
                Preview Cover
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="book-details-edit-examples">
        <BookDetailsEditExamples />
      </div>
      <div id="podcast-details-edit-examples">
        <PodcastDetailsEditExamples />
      </div>
      <div id="preview-cover-examples">
        <PreviewCoverExamples />
      </div>
    </div>
  )
}
