import { CoverSizeWidgetExamples } from './examples/CoverSizeWidgetExamples'
import { SideBySideControlsExamples } from './examples/SideBySideControlsExamples'

export default function ComponentsCatalogPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Components Catalog</h1>
        <p className="text-gray-300 mb-6">This page showcases all the available UI components in the audiobookshelf client.</p>
      </div>

      {/* Table of Contents */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-400">Table of Contents</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/items" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Item Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/buttons" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Button Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/icons" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Icon & Indicator Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/inputs" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Input & Selection Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/modals" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Modal Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/checkboxes" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Checkbox & Switch Components
              </a>
            </div>
          </div>

          <div className="mb-6 border-gray-700">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <a href="/components_catalog/alerts" className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-2">
                <span className="material-symbols text-xl">arrow_forward</span>
                Alert, Toast & Tooltip Components
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-3 text-white">Misc. Examples</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#side-by-side-controls-components" className="hover:text-blue-400 transition-colors">
                    Side By Side Controls
                  </a>
                </li>
                <li>
                  <a href="#cover-size-widget-examples" className="hover:text-blue-400 transition-colors">
                    Cover Size Widget
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
    </div>
  )
}
