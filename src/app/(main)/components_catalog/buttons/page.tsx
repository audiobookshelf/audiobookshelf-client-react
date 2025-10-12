import { BtnExamples } from '../examples/BtnExamples'
import { ContextMenuDropdownExamples } from '../examples/ContextMenuDropdownExamples'
import { IconBtnExamples } from '../examples/IconBtnExamples'
import { ReadIconBtnExamples } from '../examples/ReadIconBtnExamples'
import { ToggleBtnsExamples } from '../examples/ToggleBtnsExamples'

export default function ButtonComponentsPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Button Components</h1>
        <p className="text-gray-300 mb-6">This page showcases all the button components available in the audiobookshelf client.</p>
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
              <a href="#button-examples" className="hover:text-blue-400 transition-colors">
                Basic Buttons
              </a>
            </li>
            <li>
              <a href="#context-menu-dropdown-examples" className="hover:text-blue-400 transition-colors">
                Context Menu Button
              </a>
            </li>
            <li>
              <a href="#icon-button-examples" className="hover:text-blue-400 transition-colors">
                Icon Buttons
              </a>
            </li>
            <li>
              <a href="#read-icon-button-examples" className="hover:text-blue-400 transition-colors">
                Read Icon Buttons
              </a>
            </li>
            <li>
              <a href="#toggle-button-examples" className="hover:text-blue-400 transition-colors">
                Toggle Buttons
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="button-examples">
        <BtnExamples />
      </div>
      <div id="context-menu-dropdown-examples">
        <ContextMenuDropdownExamples />
      </div>
      <div id="icon-button-examples">
        <IconBtnExamples />
      </div>
      <div id="read-icon-button-examples">
        <ReadIconBtnExamples />
      </div>
      <div id="toggle-button-examples">
        <ToggleBtnsExamples />
      </div>
    </div>
  )
}
