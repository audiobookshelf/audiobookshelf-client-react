import { InlineIndicatorExamples } from '../examples/InlineIndicatorExamples'
import { LibraryIconExamples } from '../examples/LibraryIconExamples'
import { LoadingExamples } from '../examples/LoadingExamples'
import { MediaIconPickerExamples } from '../examples/MediaIconPickerExamples'

export default function IconComponentsPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Icon & Indicator Components</h1>
        <p className="text-gray-300 mb-6">This page showcases all the icon and indicator components available in the audiobookshelf client.</p>
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
              <a href="#library-icon-examples" className="hover:text-blue-400 transition-colors">
                Library Icons
              </a>
            </li>
            <li>
              <a href="#media-icon-picker-examples" className="hover:text-blue-400 transition-colors">
                Media Icon Pickers
              </a>
            </li>
            <li>
              <a href="#loading-examples" className="hover:text-blue-400 transition-colors">
                Loading Indicators
              </a>
            </li>
            <li>
              <a href="#inline-indicator-examples" className="hover:text-blue-400 transition-colors">
                Inline Indicators
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="library-icon-examples">
        <LibraryIconExamples />
      </div>
      <div id="media-icon-picker-examples">
        <MediaIconPickerExamples />
      </div>
      <div id="loading-examples">
        <LoadingExamples />
      </div>
      <div id="inline-indicator-examples">
        <InlineIndicatorExamples />
      </div>
    </div>
  )
}
