'use client'

import { useMediaContext } from '@/contexts/MediaContext'
import { useBookProviders, useMetadata } from '@/contexts/MetadataContext'
import { useUser } from '@/contexts/UserContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { startTransition, useEffect, useMemo, useState } from 'react'

import Btn from '@/components/ui/Btn'
import CollapsibleTable from '@/components/ui/CollapsibleTable'
import Dropdown from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import LoadingIndicator from '@/components/ui/LoadingIndicator'
import ProgressIndicator from '@/components/ui/ProgressIndicator'
import TableRow from '@/components/ui/TableRow'
import TextInput from '@/components/ui/TextInput'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import Tooltip from '@/components/ui/Tooltip'
import Alert from '@/components/widgets/Alert'
import DragDrop from '@/components/widgets/DragDrop'
import FilePicker from '@/components/widgets/FilePicker'
import { sanitizeFileName, SupportedFileTypes } from '@/lib/fileUtils'
import { bytesPretty } from '@/lib/string'
import { Library } from '@/types/api'
import path from 'path'
import { CleanedItem, FileWithMetadata, getItemsFromFilelist, upload, UploadProgressInfo } from './UploadHelper'
import { fetchBookMetadata, fetchPodcastMetadata, getCookie } from './actions'

export interface ItemToUpload extends CleanedItem {
  metadataError?: string
  isFetchingMetadata?: boolean
  isUploading?: boolean
  uploadProgress?: number
  uploadBytesLoaded?: number
  uploadBytesTotal?: number
  uploadError?: string
  uploadComplete?: boolean
  uploadFailed?: boolean
}

interface LibraryClientProps {
  libraries: Library[]
}

export default function UploadClient({ libraries }: LibraryClientProps) {
  const t = useTypeSafeTranslations()
  const { ensureProvidersLoaded } = useMetadata()
  const bookProviders = useBookProviders()

  useEffect(() => {
    ensureProvidersLoaded()
  }, [ensureProvidersLoaded])

  const [selectedLibrary, setSelectedLibrary] = useState<string>()
  const [selectedFolder, setSelectedFolder] = useState<string>()
  const [autoFetch, setAutoFetch] = useState<boolean>(false)
  const [selectedProvider, setSelectedProvider] = useState<string>()
  const [uploadProcessing, setUploadProcessing] = useState<boolean>(false)
  const [uploadFinished, setUploadFinished] = useState<boolean>(false)
  const [uploadItems, setUploadItems] = useState<ItemToUpload[]>([])
  const [ignoredFiles, setIgnoredFiles] = useState<FileWithMetadata[]>([])
  const [errors, setErrors] = useState<string>('')
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})

  const libraryItems = libraries.map((lib) => ({
    value: lib.id,
    text: lib.name
  }))

  const folderItems = libraries
    .find((lib) => lib.id === selectedLibrary)
    ?.folders?.map((folder) => ({
      value: folder.id,
      text: folder.fullPath
    }))
  const currentLibraryMediaType = libraries.find((lib) => lib.id === selectedLibrary)?.mediaType

  const { lastCurrentLibraryId } = useMediaContext()
  const { userDefaultLibraryId } = useUser()

  useEffect(() => {
    if (libraries.length === 0) return
    if (selectedLibrary) return

    let defaultLibId: string | undefined

    if (lastCurrentLibraryId) {
      defaultLibId = libraries.find((l) => l.id === lastCurrentLibraryId)?.id
    }

    if (!defaultLibId && userDefaultLibraryId) {
      defaultLibId = libraries.find((l) => l.id === userDefaultLibraryId)?.id
    }

    if (!defaultLibId) {
      defaultLibId = libraries[0].id
    }

    setSelectedLibrary(defaultLibId)
    setSelectedFolder(libraries.find((l) => l.id === defaultLibId)?.folders?.[0]?.id)
    setSelectedProvider(libraries.find((l) => l.id === defaultLibId)?.provider)
  }, [libraries, lastCurrentLibraryId, userDefaultLibraryId, selectedLibrary])

  const supFileTypes = useMemo(() => {
    let extensions: string[] = []
    Object.values(SupportedFileTypes).forEach((types) => {
      extensions = extensions.concat(types.map((t) => `.${t}`))
    })
    return extensions.join(', ')
  }, [])

  function handleFilesDropped(files: File[]): void {
    console.log('Files dropped:', files)
    const itemResults = getItemsFromFilelist(files as unknown as FileList, currentLibraryMediaType || 'book')
    console.log('Selected files:', itemResults)
    setUploadItems(itemResults.items)
    setIgnoredFiles(itemResults.ignoredFiles)
    if (itemResults.items.length === 0) {
      setErrors('MessageNoItemsFound')
    }

    if (itemResults.items.length > 0 && autoFetch) {
      itemResults.items.forEach((_, index) => {
        handleFetchMetadata(index, itemResults.items)
      })
    }
  }

  function handleDialogFileSelected(files: FileList): void {
    console.log('Files selected:', files)
    const itemResults = getItemsFromFilelist(files, currentLibraryMediaType || 'book')
    console.log('Selected files:', itemResults)
    setUploadItems(itemResults.items)
    setIgnoredFiles(itemResults.ignoredFiles)
    if (itemResults.items.length === 0) {
      setErrors('MessageNoItemsFound')
    }
    if (itemResults.items.length > 0 && autoFetch) {
      itemResults.items.forEach((_, index) => {
        handleFetchMetadata(index, itemResults.items)
      })
    }
  }

  function preventDef(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
  }

  function getDirectory(item: ItemToUpload): string {
    if (!item.title) return ''
    if (currentLibraryMediaType === 'podcast') return item.title

    const outputPathParts = [item.author, item.series, item.title]
    const cleanedOutputPathParts = outputPathParts.filter(Boolean).map((part) => sanitizeFileName(part ?? ''))

    return path.join(...cleanedOutputPathParts)
  }

  function resetUpload(): void {
    setUploadItems([])
    setIgnoredFiles([])
    setErrors('')
    setUploadProcessing(false)
    setUploadFinished(false)
  }

  const handleItemPropertyChange = (itemIndex: number, property: keyof ItemToUpload, value: string) => {
    const updatedItems = [...uploadItems]
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      [property]: value
    }
    setUploadItems(updatedItems)
  }

  const toggleTableExpanded = (itemIndex: number, tableType: 'itemFiles' | 'otherFiles' | 'ignoredFiles') => {
    const key = `${itemIndex}-${tableType}`
    setExpandedTables((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const tableHeaders = useMemo(
    () => [
      { label: t('LabelFilename'), className: 'text-left px-2' },
      { label: t('LabelSize'), className: 'text-left' },
      { label: t('LabelType'), className: 'text-left' }
    ],
    [t]
  )

  const handleFetchMetadata = async (itemIndex: number, itemsToUse: ItemToUpload[] = uploadItems) => {
    if (uploadProcessing) return

    const updatedItems = [...itemsToUse]
    const item = updatedItems[itemIndex]
    item.isFetchingMetadata = true
    setUploadItems(updatedItems)

    startTransition(async () => {
      try {
        if (currentLibraryMediaType === 'book') {
          const results = await fetchBookMetadata(item.title, item.author || '', selectedProvider || '')
          const bestCandidate = results[0]
          if (bestCandidate) {
            item.metadataError = undefined
            item.title = bestCandidate.title || item.title
            item.author = bestCandidate.author || item.author
            item.series = bestCandidate.series?.[0]?.series || ''
          } else {
            item.metadataError = t('ErrorUploadFetchMetadataNoResults')
          }
        } else if (currentLibraryMediaType === 'podcast') {
          const results = await fetchPodcastMetadata(item.title)
          const bestCandidate = results[0]
          if (bestCandidate) {
            item.metadataError = undefined
            item.title = bestCandidate.title || item.title
          } else {
            item.metadataError = t('ErrorUploadFetchMetadataNoResults')
          }
        }
      } catch {
        item.metadataError = t('ErrorUploadFetchMetadataAPI')
      } finally {
        item.isFetchingMetadata = false
        setUploadItems([...updatedItems])
      }
    })
  }

  function handleRemoveStagedItem(itemIndex: number): void {
    if (uploadProcessing || uploadItems[itemIndex]?.isUploading) {
      return
    }

    if (uploadItems.length === 1) {
      resetUpload()
      return
    }
    const updatedItems = [...uploadItems.filter((_, index) => index !== itemIndex)]
    setUploadItems(updatedItems)
  }

  // TODO chack for existing file on server before starting upload
  const handleStartUpload = async () => {
    setUploadProcessing(true)
    setUploadFinished(false)
    const cookie = await getCookie()
    for (const item of uploadItems) {
      item.isUploading = true
      item.uploadProgress = 0
      item.uploadBytesLoaded = 0
      item.uploadBytesTotal = item.itemFiles.reduce((sum, file) => sum + file.size, 0)

      try {
        await upload(item, selectedLibrary!, selectedFolder!, currentLibraryMediaType!, cookie, (progress: UploadProgressInfo) => {
          item.uploadProgress = progress.percent
          item.uploadBytesLoaded = progress.loaded
          item.uploadBytesTotal = progress.total
          const updatedItemsForProgress = [...uploadItems]
          setUploadItems(updatedItemsForProgress)
        })
      } catch (error) {
        console.error('Upload failed:', error)
        item.uploadFailed = true
      } finally {
        item.isUploading = false
        item.uploadComplete = !item.uploadFailed
      }
    }
    setUploadItems([...uploadItems])
    setUploadProcessing(false)
    setUploadFinished(true)
  }

  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-8"
      draggable={false}
      onDragEnter={preventDef}
      onDragOver={preventDef}
      onDragEnd={preventDef}
      onDrop={preventDef}
    >
      {/* First row: Library, Folder, Media Type */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="library" className="mb-1 block px-1 text-sm font-medium">
            {t('LabelLibrary')}
          </label>
          <Dropdown
            items={libraryItems}
            value={selectedLibrary}
            onChange={(value) => {
              const lib = libraries.find((l) => l.id === value)
              setSelectedLibrary(value as string)
              setSelectedFolder(lib?.folders?.[0]?.id)
            }}
          />
        </div>

        <div className="w-full min-w-[200px] md:flex-3">
          <label htmlFor="folder" className="mb-1 block px-1 text-sm font-medium">
            {t('LabelFolder')}
          </label>
          <Dropdown items={folderItems} value={selectedFolder} onChange={(value) => setSelectedFolder(value as string)} />
        </div>

        <div className="w-32 min-w-32">
          <label htmlFor="mediaType" className="mb-1 block px-1 text-sm font-medium">
            {t('LabelMediaType')}
          </label>
          <TextInput id="mediaType" readOnly={true} value={currentLibraryMediaType} />
        </div>
      </div>
      {/* Second row: Auto Fetch, Metadata Provider (books only) */}
      {currentLibraryMediaType === 'book' && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center pt-6">
            <ToggleSwitch label={t('LabelAutoFetchMetadata')} value={autoFetch} className="pr-0" onChange={setAutoFetch} />
            <Tooltip maxWidth={300} text={t('LabelAutoFetchMetadataHelp')}>
              <span className="material-symbols text-lg">info</span>
            </Tooltip>
          </div>

          <div className="min-w-[200px] flex-1">
            <label htmlFor="provider" className="mb-1 block px-1 text-sm font-medium">
              {t('LabelProvider')}
            </label>
            <Dropdown items={bookProviders} value={selectedProvider} onChange={(value) => setSelectedProvider(value as string)} />
          </div>
        </div>
      )}
      {/* Add Files / drag and drop */}
      {uploadItems.length === 0 && errors === '' && (
        <div className="text-center">
          <DragDrop onFilesDropped={handleFilesDropped}>
            <p className="px-6 pt-6 text-2xl">{t('LabelUploaderDragAndDrop')}</p>
            <p className="p-6">{t('MessageOr')}</p>
            <div className="flex justify-center gap-4">
              <FilePicker accept={supFileTypes} onFilesSelected={handleDialogFileSelected}>
                {t('ButtonChooseFiles')}
              </FilePicker>
              <FilePicker multiple={true} directory={true} onFilesSelected={handleDialogFileSelected}>
                {t('ButtonChooseAFolder')}
              </FilePicker>
            </div>
            <p className="text-foreground-subdued p-6 text-xs">
              <strong>{t('LabelSupportedFileTypes')}:</strong> {supFileTypes}
            </p>
            <p className="text-foreground-subdued px-6 pb-6 text-sm">
              {t('NoteUploaderFoldersWithMediaFiles')} {currentLibraryMediaType === 'book' ? t('NoteUploaderOnlyAudioFiles') : ''}
            </p>
          </DragDrop>
        </div>
      )}

      {/* 'staging' area */}
      {(uploadItems.length > 0 || ignoredFiles.length > 0 || errors !== '') && (
        <>
          <div className="border-border flex w-full items-center border-b py-4">
            <p className="flex-1 text-lg">{t('LabelXItems', { 0: uploadItems.length })}</p>
            <Btn disabled={uploadProcessing} size="small" onClick={resetUpload}>
              {t('ButtonReset')}
            </Btn>
          </div>
          {errors === 'MessageNoItemsFound' && (
            <Alert type="error" autoFocus={false}>
              <div className="pe-4">
                <p>{t('MessageNoItemsFound')}</p>
              </div>
            </Alert>
          )}
          {ignoredFiles.length > 0 && (
            <Alert type="warning" autoFocus={false}>
              <div className="pe-8">
                <p>{t('NoteUploaderUnsupportedFiles')}</p>
                <div className="text-read-only">
                  <CollapsibleTable
                    tableClassName="bg-bg"
                    title={t('HeaderIgnoredFiles')}
                    count={ignoredFiles.length}
                    // hard coded to index 0 as there will only be one ignored files table
                    expanded={expandedTables[`0-ignoredFiles`] || false}
                    onExpandedChange={() => toggleTableExpanded(0, 'ignoredFiles')}
                    tableHeaders={tableHeaders}
                  >
                    {ignoredFiles.map((file) => (
                      <TableRow key={file.name} className="text-left">
                        <td>
                          <p className="pl-2">{file.name}</p>
                        </td>
                        <td>
                          <p>{bytesPretty(file.size)}</p>
                        </td>
                        <td>
                          <p>{file.filetype}</p>
                        </td>
                      </TableRow>
                    ))}
                  </CollapsibleTable>
                </div>
                <p className="text-foreground-subdued text-xs">
                  <strong>{t('LabelSupportedFileTypes')}:</strong> {supFileTypes}
                </p>
              </div>
            </Alert>
          )}
          {uploadItems.map((item, index) => (
            <div key={index} className="border-border relative my-6 flex w-full flex-col gap-1 rounded-md border px-2 py-4 shadow-lg md:px-6">
              <>
                {!item.uploadComplete && !item.uploadFailed && (
                  <>
                    {item.isUploading && (
                      <LoadingIndicator label={'MessageUploading'}>
                        <ProgressIndicator progress={item.uploadProgress || 0} />
                        <p className="text-foreground-muted mt-2 text-center text-xs">
                          ({bytesPretty(item.uploadBytesLoaded || 0)}/{bytesPretty(item.uploadBytesTotal || 0)})
                        </p>
                      </LoadingIndicator>
                    )}
                    {item.isFetchingMetadata && <LoadingIndicator label="LabelFetchingMetadata" />}
                    {/* floating # on left */}
                    <div className="bg-bg border-border absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full border">
                      <p className="text-base">{'#' + (index + 1)}</p>
                    </div>
                    {/* floating x on right */}
                    {!uploadProcessing && !item.isUploading && (
                      <IconBtn
                        className="bg-bg border-border absolute -top-3 -right-3 h-8 w-8 rounded-full border"
                        onClick={() => handleRemoveStagedItem(index)}
                      >
                        close
                      </IconBtn>
                    )}
                    {item.metadataError && (
                      <Alert type="error" autoFocus={false}>
                        <p>{item.metadataError}</p>
                      </Alert>
                    )}
                    <div className="-mx-2 mb-4 flex flex-wrap items-center">
                      <div className="w-full p-2 md:w-1/2">
                        <label htmlFor="" className="mb-1 px-1 text-sm">
                          {t('LabelTitle')}
                        </label>
                        <TextInput value={item.title} onChange={(value) => handleItemPropertyChange(index, 'title', value)} />
                      </div>
                      {currentLibraryMediaType === 'book' && (
                        <div className="w-full p-2 md:w-1/2">
                          <div className="flex items-end">
                            <div className="w-full pe-2">
                              <label htmlFor="" className="mb-1 px-1 text-sm">
                                {t('LabelAuthor')}
                              </label>
                              <TextInput value={item.author} onChange={(value) => handleItemPropertyChange(index, 'author', value)} />
                            </div>
                            <Tooltip text={t('LabelUploaderItemFetchMetadataHelp')}>
                              <IconBtn onClick={() => handleFetchMetadata(index)}>sync</IconBtn>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      {currentLibraryMediaType === 'book' && (
                        <div className="w-full p-2 md:w-1/2">
                          <label htmlFor="" className="mb-1 px-1 text-sm">
                            {t('LabelUploaderItemSeriesLabel')}
                          </label>
                          <TextInput value={item.series} onChange={(value) => handleItemPropertyChange(index, 'series', value)} />
                        </div>
                      )}

                      <div className="w-full p-2 md:w-1/2">
                        <label htmlFor="" className="mb-1 px-1 text-sm">
                          {t('LabelUploaderItemDirectory')}
                        </label>
                        <TextInput readOnly={true} value={getDirectory(item)} />
                      </div>
                    </div>
                    <CollapsibleTable
                      title={t('HeaderItemFiles')}
                      count={item.itemFiles.length}
                      expanded={expandedTables[`${index}-itemFiles`] || false}
                      onExpandedChange={() => toggleTableExpanded(index, 'itemFiles')}
                      tableHeaders={tableHeaders}
                    >
                      {item.itemFiles.map((file) => (
                        <TableRow key={file.name} className="text-left">
                          <td>
                            <p className="pl-2">{file.name}</p>
                          </td>
                          <td>
                            <p>{bytesPretty(file.size)}</p>
                          </td>
                          <td>
                            <p>{file.filetype}</p>
                          </td>
                        </TableRow>
                      ))}
                    </CollapsibleTable>
                    {item.otherFiles.length > 0 && (
                      <CollapsibleTable
                        title={t('HeaderOtherFiles')}
                        count={item.otherFiles.length}
                        expanded={expandedTables[`${index}-otherFiles`] || false}
                        onExpandedChange={() => toggleTableExpanded(index, 'otherFiles')}
                        tableHeaders={tableHeaders}
                      >
                        {item.otherFiles.map((file) => (
                          <TableRow key={file.name} className="text-left">
                            <td>
                              <p className="pl-2">{file.name}</p>
                            </td>
                            <td>
                              <p>{bytesPretty(file.size)}</p>
                            </td>
                            <td>
                              <p>{file.filetype}</p>
                            </td>
                          </TableRow>
                        ))}
                      </CollapsibleTable>
                    )}
                  </>
                )}
                {item.uploadComplete && (
                  <Alert type="success" autoFocus={false}>
                    <p>{t('MessageUploaderItemSuccess')}</p>
                  </Alert>
                )}
                {item.uploadFailed && (
                  <Alert type="error" autoFocus={false}>
                    <p>{t('MessageUploaderItemFailed')}</p>
                  </Alert>
                )}
              </>
            </div>
          ))}
          {uploadItems.length > 0 && !uploadFinished && (
            <div className="flex w-full justify-end">
              <Btn disabled={uploadProcessing} color="bg-success" onClick={handleStartUpload}>
                {t('ButtonUpload')}
              </Btn>
            </div>
          )}
        </>
      )}
    </div>
  )
}
