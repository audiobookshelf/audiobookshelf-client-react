import { CronExpressionBuilderExamples } from '../examples/CronExpressionBuilderExamples'
import { DropdownExamples } from '../examples/DropdownExamples'
import { DurationPickerExamples } from '../examples/DurationPickerExamples'
import { InputDropdownExamples } from '../examples/InputDropdownExamples'
import { MultiSelectDropdownExamples } from '../examples/MultiSelectDropdownExamples'
import { MultiSelectExamples } from '../examples/MultiSelectExamples'
import { RangeInputExamples } from '../examples/RangeInputExamples'
import { SlateEditorExamples } from '../examples/SlateEditorExamples'
import { TextInputExamples } from '../examples/TextInputExamples'
import { TextareaInputExamples } from '../examples/TextareaInputExamples'
import { TwoStageMultiSelectExamples } from '../examples/TwoStageMultiSelectExamples'

export default function InputComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Input & Selection Components</h1>
        <p className="mb-6 text-gray-300">This page showcases all the input, dropdown, and selection components available in the audiobookshelf client.</p>
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
              <a href="#cron-expression-builder-examples" className="transition-colors hover:text-blue-400">
                Cron Expression Builder
              </a>
            </li>
            <li>
              <a href="#dropdown-examples" className="transition-colors hover:text-blue-400">
                Dropdowns
              </a>
            </li>
            <li>
              <a href="#duration-picker-examples" className="transition-colors hover:text-blue-400">
                Duration Picker
              </a>
            </li>
            <li>
              <a href="#file-input-examples" className="transition-colors hover:text-blue-400">
                File Inputs
              </a>
            </li>
            <li>
              <a href="#input-dropdown-examples" className="transition-colors hover:text-blue-400">
                Input Dropdowns
              </a>
            </li>
            <li>
              <a href="#textarea-input-examples" className="transition-colors hover:text-blue-400">
                Textarea Inputs
              </a>
            </li>
            <li>
              <a href="#text-input-examples" className="transition-colors hover:text-blue-400">
                Text Inputs
              </a>
            </li>
            <li>
              <a href="#multi-select-examples" className="transition-colors hover:text-blue-400">
                Multi Selects
              </a>
            </li>
            <li>
              <a href="#two-stage-multi-select-examples" className="transition-colors hover:text-blue-400">
                Two Stage Multi Selects
              </a>
            </li>
            <li>
              <a href="#multi-select-dropdown-examples" className="transition-colors hover:text-blue-400">
                Multi Select Dropdowns
              </a>
            </li>
            <li>
              <a href="#range-input-examples" className="transition-colors hover:text-blue-400">
                Range Inputs
              </a>
            </li>
            <li>
              <a href="#slate-editor-examples" className="transition-colors hover:text-blue-400">
                Rich Text Editor
              </a>
            </li>
            <li>
              <a href="#text-input-examples" className="transition-colors hover:text-blue-400">
                Text Inputs
              </a>
            </li>
            <li>
              <a href="#textarea-input-examples" className="transition-colors hover:text-blue-400">
                Textarea Inputs
              </a>
            </li>
            <li>
              <a href="#two-stage-multi-select-examples" className="transition-colors hover:text-blue-400">
                Two Stage Multi Selects
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div id="dropdown-examples">
        <DropdownExamples />
      </div>
      <div id="input-dropdown-examples">
        <InputDropdownExamples />
      </div>
      <div id="textarea-input-examples">
        <TextareaInputExamples />
      </div>
      <div id="text-input-examples">
        <TextInputExamples />
      </div>
      <div id="multi-select-examples">
        <MultiSelectExamples />
      </div>
      <div id="two-stage-multi-select-examples">
        <TwoStageMultiSelectExamples />
      </div>
      <div id="multi-select-dropdown-examples">
        <MultiSelectDropdownExamples />
      </div>
      <div id="range-input-examples">
        <RangeInputExamples />
      </div>
      <div id="cron-expression-builder-examples">
        <CronExpressionBuilderExamples />
      </div>
      <div id="duration-picker-examples">
        <DurationPickerExamples />
      </div>
      <div id="slate-editor-examples">
        <SlateEditorExamples />
      </div>
    </div>
  )
}
