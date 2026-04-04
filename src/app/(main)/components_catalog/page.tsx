import { CoverSizeWidgetExamples } from './examples/CoverSizeWidgetExamples'
import { EditListExamples } from './examples/EditListExamples'
import { SideBySideControlsExamples } from './examples/SideBySideControlsExamples'

export default function ComponentsCatalogPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Components Catalog</h1>
        <p className="mb-6 text-gray-300">This page showcases all the available UI components in the audiobookshelf client.</p>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold text-gray-400">Table of Contents</h2>
        <div className="rounded-lg bg-gray-800 p-6">
          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/items" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Item Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/buttons" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Button Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/icons" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Icon & Indicator Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/inputs" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Input & Selection Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/modals" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Modal Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/checkboxes" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Checkbox & Switch Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
              <a href="/components_catalog/alerts" className="flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300">
                <span className="material-symbols text-xl">arrow_forward</span>
                Alert, Toast & Tooltip Components
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-medium text-white">Misc. Examples</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#side-by-side-controls-components" className="transition-colors hover:text-blue-400">
                    Side By Side Controls
                  </a>
                </li>
                <li>
                  <a href="#cover-size-widget-examples" className="transition-colors hover:text-blue-400">
                    Cover Size Widget
                  </a>
                </li>
                <li>
                  <a href="#edit-list-examples" className="transition-colors hover:text-blue-400">
                    Edit List
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div id="side-by-side-controls-components">
        <SideBySideControlsExamples />
      </div>
      <div id="cover-size-widget-examples">
        <CoverSizeWidgetExamples />
      </div>
      <div id="edit-list-examples">
        <EditListExamples />
      </div>
    </div>
  )
}
