'use client'

import Btn from '@/components/ui/Btn'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import MediaIconPicker from '@/components/ui/MediaIconPicker'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { LibraryFormData } from './LibraryEditModal'
import LibraryFolderChooser from './LibraryFolderChooser'

const mediaTypeItems: DropdownItem[] = [
  { text: 'Books', value: 'book' },
  { text: 'Podcasts', value: 'podcast' }
]

interface LibraryDetailsTabProps {
  formData: LibraryFormData
  isEditing: boolean
  providerItems: DropdownItem[]
  newFolderPath: string
  showFolderChooser: boolean
  onFormDataChange: (updater: (prev: LibraryFormData) => LibraryFormData) => void
  onMediaTypeChange: (value: string | number) => void
  onNewFolderPathChange: (value: string) => void
  onCommitNewFolder: () => void
  onNewFolderKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onRemoveFolder: (index: number) => void
  onFolderSelected: (folderPath: string) => void
  onShowFolderChooser: () => void
  onHideFolderChooser: () => void
}

export default function LibraryDetailsTab({
  formData,
  isEditing,
  providerItems,
  newFolderPath,
  showFolderChooser,
  onFormDataChange,
  onMediaTypeChange,
  onNewFolderPathChange,
  onCommitNewFolder,
  onNewFolderKeyDown,
  onRemoveFolder,
  onFolderSelected,
  onShowFolderChooser,
  onHideFolderChooser
}: LibraryDetailsTabProps) {
  const t = useTypeSafeTranslations()

  return (
    <>
      {/* Top Row: Media Type, Library Name, Icon, Metadata Provider */}
      <div className="flex flex-wrap items-start gap-2">
        {/* Media Type */}
        <Dropdown
          label={t('LabelMediaType')}
          value={formData.mediaType}
          items={mediaTypeItems}
          disabled={isEditing}
          highlightSelected
          onChange={onMediaTypeChange}
          className="w-full sm:w-36 shrink-0"
        />

        {/* Library Name */}
        <TextInput
          label={t('LabelLibraryName')}
          value={formData.name}
          placeholder={t('LabelLibraryName')}
          onChange={(value) => onFormDataChange((prev) => ({ ...prev, name: value }))}
          className="w-full sm:flex-1"
        />

        {/* Icon */}
        <MediaIconPicker value={formData.icon} label={t('LabelIcon')} onChange={(value) => onFormDataChange((prev) => ({ ...prev, icon: value }))} />

        {/* Metadata Provider */}
        <Dropdown
          label={t('LabelMetadataProvider')}
          value={formData.provider}
          items={providerItems}
          highlightSelected
          onChange={(value) => onFormDataChange((prev) => ({ ...prev, provider: String(value) }))}
          className="flex-1 sm:w-44 sm:shrink-0"
        />
      </div>

      {/* Folders Section */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground-muted mb-2">{t('LabelFolders')}</h3>

        <div className="space-y-2">
          {/* Committed folder paths */}
          {formData.folders.map((folder, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="material-symbols fill text-yellow-200 text-xl">folder</span>
              <TextInput value={folder.fullPath} readOnly className="flex-1 text-sm" />
              <div className="w-5">
                <button
                  type="button"
                  className="material-symbols text-foreground-muted hover:text-error text-xl cursor-pointer"
                  onClick={() => onRemoveFolder(index)}
                  aria-label={t('ButtonRemove')}
                >
                  close
                </button>
              </div>
            </div>
          ))}

          {/* Always-visible new folder input */}
          <div className="flex items-center gap-2">
            <span className="material-symbols fill text-yellow-200/50 text-xl">create_new_folder</span>
            <TextInput
              value={newFolderPath}
              placeholder={t('PlaceholderNewFolderPath')}
              onChange={onNewFolderPathChange}
              onBlur={onCommitNewFolder}
              onKeyDown={onNewFolderKeyDown}
              className="flex-1 text-sm"
            />
            {formData.folders.length > 0 && <div className="w-5"></div>}
          </div>
        </div>

        {/* Browse for Folder button */}
        <Btn color="bg-primary" className="w-full mt-3" onClick={onShowFolderChooser}>
          {t('ButtonBrowseForFolder')}
        </Btn>
      </div>

      {/* Folder Chooser Overlay */}
      {showFolderChooser && <LibraryFolderChooser paths={formData.folders.map((f) => f.fullPath)} onSelect={onFolderSelected} onBack={onHideFolderChooser} />}
    </>
  )
}
