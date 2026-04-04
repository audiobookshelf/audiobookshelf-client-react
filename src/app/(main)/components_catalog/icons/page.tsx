import { InlineIndicatorExamples } from '../examples/InlineIndicatorExamples'
import { LibraryIconExamples } from '../examples/LibraryIconExamples'
import { LoadingExamples } from '../examples/LoadingExamples'
import { MediaIconPickerExamples } from '../examples/MediaIconPickerExamples'

export default function IconComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Icon & Indicator Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the icon and indicator components available in the audiobookshelf client.</p>
        <a href="/components_catalog" className="text-blue-400 transition-colors hover:text-blue-300">
          ← Back to Components Catalog
        </a>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-400">Table of Contents</h2>
        <div className="rounded-lg bg-gray-800 p-6">
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="#library-icon-examples" className="transition-colors hover:text-blue-400">
                Library Icons
              </a>
            </li>
            <li>
              <a href="#media-icon-picker-examples" className="transition-colors hover:text-blue-400">
                Media Icon Pickers
              </a>
            </li>
            <li>
              <a href="#loading-examples" className="transition-colors hover:text-blue-400">
                Loading Indicators
              </a>
            </li>
            <li>
              <a href="#inline-indicator-examples" className="transition-colors hover:text-blue-400">
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
