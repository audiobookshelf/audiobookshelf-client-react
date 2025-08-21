'use client'

import {
  BtnExamples,
  IconBtnExamples,
  ContextMenuDropdownExamples,
  DropdownExamples,
  InputDropdownExamples,
  TextareaInputExamples,
  TextInputExamples,
  MultiSelectExamples,
  TwoStageMultiSelectExamples,
  MultiSelectDropdownExamples,
  ModalExamples,
  RangeInputExamples,
  ReadIconBtnExamples,
  CheckboxExamples,
  FileInputExamples,
  LibraryIconExamples,
  MediaIconPickerExamples,
  SideBySideControlsExamples,
  LoadingExamples,
  AdvancedModalExamples,
  ToastNotificationExamples,
  DurationPickerExamples,
  ToggleBtnsExamples,
  ToggleSwitchExamples
} from './ComponentExamples'

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-3 text-white">Component Examples</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#button-components" className="hover:text-blue-400 transition-colors">
                    Buttons
                  </a>
                </li>
                <li>
                  <a href="#icon-button-components" className="hover:text-blue-400 transition-colors">
                    Icon Buttons
                  </a>
                </li>
                <li>
                  <a href="#read-icon-button-components" className="hover:text-blue-400 transition-colors">
                    Read Icon Buttons
                  </a>
                </li>
                <li>
                  <a href="#context-menu-dropdown-components" className="hover:text-blue-400 transition-colors">
                    Context Menu Dropdowns
                  </a>
                </li>
                <li>
                  <a href="#dropdown-components" className="hover:text-blue-400 transition-colors">
                    Dropdowns
                  </a>
                </li>
                <li>
                  <a href="#input-dropdown-components" className="hover:text-blue-400 transition-colors">
                    Input Dropdowns
                  </a>
                </li>
                <li>
                  <a href="#textarea-input-components" className="hover:text-blue-400 transition-colors">
                    Textarea Inputs
                  </a>
                </li>
                <li>
                  <a href="#text-input-components" className="hover:text-blue-400 transition-colors">
                    Text Inputs
                  </a>
                </li>
                <li>
                  <a href="#multi-select-components" className="hover:text-blue-400 transition-colors">
                    Multi Selects
                  </a>
                </li>
                <li>
                  <a href="#two-stage-multi-select-components" className="hover:text-blue-400 transition-colors">
                    Two Stage Multi Selects
                  </a>
                </li>
                <li>
                  <a href="#multi-select-dropdown-components" className="hover:text-blue-400 transition-colors">
                    Multi Select Dropdowns
                  </a>
                </li>
                <li>
                  <a href="#modal-components" className="hover:text-blue-400 transition-colors">
                    Modals
                  </a>
                </li>
                <li>
                  <a href="#advanced-modal-examples" className="hover:text-blue-400 transition-colors">
                    Advanced Modal Examples
                  </a>
                </li>
                <li>
                  <a href="#range-input-components" className="hover:text-blue-400 transition-colors">
                    Range Inputs
                  </a>
                </li>
                <li>
                  <a href="#duration-picker-components" className="hover:text-blue-400 transition-colors">
                    Duration Picker
                  </a>
                </li>
                <li>
                  <a href="#toggle-buttons-components" className="hover:text-blue-400 transition-colors">
                    Toggle Buttons
                  </a>
                </li>
                <li>
                  <a href="#toggle-switch-components" className="hover:text-blue-400 transition-colors">
                    Toggle Switches
                  </a>
                </li>
                <li>
                  <a href="#checkbox-components" className="hover:text-blue-400 transition-colors">
                    Checkboxes
                  </a>
                </li>
                <li>
                  <a href="#file-input-components" className="hover:text-blue-400 transition-colors">
                    File Inputs
                  </a>
                </li>
                <li>
                  <a href="#library-icon-components" className="hover:text-blue-400 transition-colors">
                    Library Icons
                  </a>
                </li>
                <li>
                  <a href="#media-icon-picker-components" className="hover:text-blue-400 transition-colors">
                    Media Icon Pickers
                  </a>
                </li>
                <li>
                  <a href="#side-by-side-controls-components" className="hover:text-blue-400 transition-colors">
                    Side By Side Controls
                  </a>
                </li>
                <li>
                  <a href="#loading-components" className="hover:text-blue-400 transition-colors">
                    Loading Indicators
                  </a>
                </li>
                <li>
                  <a href="#toast-notification-examples" className="hover:text-blue-400 transition-colors">
                    Toasts
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div id="button-components">
        <BtnExamples />
      </div>
      <div id="icon-button-components">
        <IconBtnExamples />
      </div>
      <div id="read-icon-button-components">
        <ReadIconBtnExamples />
      </div>
      <div id="context-menu-dropdown-components">
        <ContextMenuDropdownExamples />
      </div>
      <div id="dropdown-components">
        <DropdownExamples />
      </div>
      <div id="input-dropdown-components">
        <InputDropdownExamples />
      </div>
      <div id="textarea-input-components">
        <TextareaInputExamples />
      </div>
      <div id="text-input-components">
        <TextInputExamples />
      </div>
      <div id="multi-select-components">
        <MultiSelectExamples />
      </div>
      <div id="two-stage-multi-select-components">
        <TwoStageMultiSelectExamples />
      </div>
      <div id="multi-select-dropdown-components">
        <MultiSelectDropdownExamples />
      </div>
      <div id="modal-components">
        <ModalExamples />
      </div>
      <div id="advanced-modal-examples">
        <AdvancedModalExamples />
      </div>
      <div id="range-input-components">
        <RangeInputExamples />
      </div>
      <div id="duration-picker-components">
        <DurationPickerExamples />
      </div>
      <div id="toggle-buttons-components">
        <ToggleBtnsExamples />
      </div>
      <div id="toggle-switch-components">
        <ToggleSwitchExamples />
      </div>
      <div id="checkbox-components">
        <CheckboxExamples />
      </div>
      <div id="file-input-components">
        <FileInputExamples />
      </div>
      <div id="library-icon-components">
        <LibraryIconExamples />
      </div>
      <div id="media-icon-picker-components">
        <MediaIconPickerExamples />
      </div>
      <div id="side-by-side-controls-components">
        <SideBySideControlsExamples />
      </div>
      <div id="loading-components">
        <LoadingExamples />
      </div>
      <div id="toast-notification-examples">
        <ToastNotificationExamples />
      </div>
    </div>
  )
}
