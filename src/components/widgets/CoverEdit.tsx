'use client'

import { removeCoverAction, setCoverFromLocalFileAction, updateCoverFromUrlAction, uploadCoverAction } from '@/app/actions/coverActions'
import PreviewCover from '@/components/covers/PreviewCover'
import CoverPreviewModal from '@/components/modals/CoverPreviewModal'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import FileInput from '@/components/ui/FileInput'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useBookCoverProviders, useMetadata, usePodcastCoverProviders } from '@/contexts/MetadataContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useCoverSearch } from '@/hooks/useCoverSearch'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { getLibraryFileUrl, getLibraryItemCoverUrl, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { BookLibraryItem, LibraryFile, PodcastLibraryItem } from '@/types/api'
import React, { useEffect, useMemo, useState, useTransition } from 'react'

interface LocalCover extends LibraryFile {
  localPath: string
}

interface CoverEditProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
  bookCoverAspectRatio: number
}

export default function CoverEdit({ libraryItem, bookCoverAspectRatio }: CoverEditProps) {
  const t = useTypeSafeTranslations()
  const { user, userCanDelete } = useUser()
  const { showToast } = useGlobalToast()

  // Transitions for server actions
  const [isPendingUpload, startUploadTransition] = useTransition()
  const [isPendingUpdate, startUpdateTransition] = useTransition()

  const isPodcast = libraryItem.mediaType === 'podcast'

  // Get providers from context based on media type
  const { ensureProvidersLoaded } = useMetadata()
  const bookCoverProviders = useBookCoverProviders()
  const podcastCoverProviders = usePodcastCoverProviders()

  const providers = isPodcast ? podcastCoverProviders : bookCoverProviders

  // Ensure providers are loaded when component mounts
  useEffect(() => {
    ensureProvidersLoaded()
  }, [ensureProvidersLoaded])

  // Cover search via WebSocket
  const handleSearchError = () => {
    showToast(t('MessageCoverSearchFailed'), { type: 'error' })
  }

  const { coversFound, searchInProgress, hasSearched, searchCovers, cancelSearch, resetSearch } = useCoverSearch(handleSearchError)

  // State
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showLocalCovers, setShowLocalCovers] = useState(false)
  const [previewUpload, setPreviewUpload] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [provider, setProvider] = useState('google')
  const [selectedCoverForPreview, setSelectedCoverForPreview] = useState<string | null>(null)

  const media = libraryItem.media || {}
  const coverPath = media.coverPath

  const coverUrl = !coverPath ? getPlaceholderCoverUrl() : getLibraryItemCoverUrl(libraryItem.id, libraryItem.updatedAt, true)

  // Keep useMemo for localCovers since it filters and maps an array
  const localCovers = useMemo(() => {
    const libraryFiles = (libraryItem.libraryFiles || []) as LibraryFile[]
    return libraryFiles
      .filter((f) => f.fileType === 'image')
      .map(
        (file): LocalCover => ({
          ...file,
          localPath: getLibraryFileUrl(libraryItem.id, file.ino)
        })
      )
  }, [libraryItem.libraryFiles, libraryItem.id])

  const userCanUpload = user.permissions?.upload || false

  const searchTitleLabel = provider.startsWith('audible') ? t('LabelSearchTitleOrASIN') : provider === 'itunes' ? t('LabelSearchTerm') : t('LabelSearchTitle')

  // Initialize component - only run when library item ID changes
  useEffect(() => {
    setShowLocalCovers(false)
    setPreviewUpload(null)
    setSelectedFile(null)
    // Access metadata directly from libraryItem to avoid dependency on computed object
    const metadata = libraryItem.media?.metadata
    const authorNameValue = metadata && 'authorName' in metadata ? metadata.authorName || '' : ''
    setImageUrl('')
    setSearchTitle(typeof metadata?.title === 'string' ? metadata.title : '')
    setSearchAuthor(typeof authorNameValue === 'string' ? authorNameValue : '')
    resetSearch()

    if (isPodcast) {
      setProvider('itunes')
    } else {
      // Migrate from 'all' to 'best' (only once)
      const migrationKey = 'book-cover-provider-migrated'
      const currentProvider = localStorage.getItem('book-cover-provider') || localStorage.getItem('book-provider') || 'google'

      if (!localStorage.getItem(migrationKey) && currentProvider === 'all') {
        localStorage.setItem('book-cover-provider', 'best')
        localStorage.setItem(migrationKey, 'true')
        setProvider('best')
      } else {
        setProvider(currentProvider)
      }
    }
  }, [libraryItem, isPodcast, resetSearch])

  // Handlers
  const resetCoverPreview = () => {
    setPreviewUpload(null)
    setSelectedFile(null)
  }

  const submitCoverUpload = () => {
    if (!selectedFile) return

    const fileToUpload = selectedFile

    startUploadTransition(async () => {
      try {
        // Convert File to Base64 for server action
        const arrayBuffer = await fileToUpload.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
        const base64 = btoa(binary)
        await uploadCoverAction(libraryItem.id, base64, fileToUpload.name)
      } catch (error) {
        console.error('Upload error:', error)
        showToast(error instanceof Error ? error.message : t('ToastUnknownError'), { type: 'error' })
      }
    })

    // Reset preview immediately, not inside the transition
    resetCoverPreview()
  }

  const fileUploadSelected = (file: File) => {
    setPreviewUpload(URL.createObjectURL(file))
    setSelectedFile(file)
  }

  const handleRemoveCover = () => {
    if (!coverPath) return

    startUpdateTransition(async () => {
      try {
        await removeCoverAction(libraryItem.id)
      } catch (error) {
        console.error('Error removing cover:', error)
        showToast(error instanceof Error ? error.message : 'Failed to remove cover', { type: 'error' })
      }
    })
  }

  const handleUpdateCover = (cover: string) => {
    startUpdateTransition(async () => {
      try {
        await updateCoverFromUrlAction(libraryItem.id, cover)
        setImageUrl('')
      } catch (error) {
        console.error('Error updating cover:', error)
        showToast(error instanceof Error ? error.message : t('ToastCoverUpdateFailed'), { type: 'error' })
      }
    })
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    handleUpdateCover(imageUrl)
  }

  const persistProvider = () => {
    try {
      localStorage.setItem('book-cover-provider', provider)
    } catch (error) {
      console.error('PersistProvider', error)
    }
  }

  const submitSearchForm = (e: React.FormEvent) => {
    e.preventDefault()

    // Store provider in local storage
    persistProvider()

    // Initiate search via hook
    searchCovers({
      title: searchTitle,
      author: searchAuthor || '',
      provider: provider,
      podcast: isPodcast
    })
  }

  const handleSetCover = (coverFile: LocalCover) => {
    startUpdateTransition(async () => {
      try {
        await setCoverFromLocalFileAction(libraryItem.id, coverFile.metadata.path)
      } catch (error) {
        console.error('Error setting cover:', error)
        showToast(error instanceof Error ? error.message : t('ToastCoverUpdateFailed'), { type: 'error' })
      }
    })
  }

  const localCoverImageCount = `${localCovers.length} local ${localCovers.length === 1 ? 'image' : 'images'}`

  const handleCoverClick = (cover: string) => {
    setSelectedCoverForPreview(cover)
  }

  const handleCloseCoverPreview = () => {
    setSelectedCoverForPreview(null)
  }

  const handleApplyCover = () => {
    if (!selectedCoverForPreview) return
    handleCloseCoverPreview()
    handleUpdateCover(selectedCoverForPreview)
  }

  return (
    <div className="relative h-full w-full overflow-hidden overflow-y-auto px-2 py-6 sm:px-4">
      <div className="mb-4 flex flex-col sm:flex-row">
        <div className="relative self-center md:self-start">
          <PreviewCover src={coverUrl} width={120} bookCoverAspectRatio={bookCoverAspectRatio} />

          {/* book cover overlay */}
          {media.coverPath && (
            <div className="absolute top-0 left-0 z-10 h-full w-full opacity-0 transition-opacity duration-100 hover:opacity-100">
              <div className="absolute top-0 left-0 h-16 w-full bg-gradient-to-b from-black/60 to-transparent" />
              {userCanDelete && (
                <div
                  className={mergeClasses(
                    'absolute top-1 right-1 h-8 w-8 rounded-full p-1 text-red-500',
                    isPendingUpdate ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-red-400'
                  )}
                  onClick={isPendingUpdate ? undefined : handleRemoveCover}
                >
                  <Tooltip text={t('LabelRemoveCover')} position="top">
                    <span className="material-symbols text-2xl">delete</span>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grow sm:ps-2 sm:pe-2 md:mt-0 md:ps-6">
          <div className="flex items-center">
            {userCanUpload && (
              <div className="w-10 pe-2 md:w-40 md:min-w-32">
                <FileInput onChange={fileUploadSelected}>
                  <span className="hidden md:inline-block">{t('ButtonUploadCover')}</span>
                  <span className="material-symbols inline-block text-2xl md:!hidden">upload</span>
                </FileInput>
              </div>
            )}

            <form onSubmit={submitForm} className="flex grow">
              <TextInput value={imageUrl} onChange={setImageUrl} placeholder={t('LabelImageURLFromTheWeb')} className="h-9 w-full" disabled={isPendingUpdate} />
              <Btn color="bg-success" type="submit" disabled={!imageUrl || isPendingUpdate} loading={isPendingUpdate} className="ms-2 h-9 w-24 px-4 sm:ms-3">
                {t('ButtonSubmit')}
              </Btn>
            </form>
          </div>

          {localCovers.length > 0 && (
            <div className="mt-6 mb-4 border-t border-b border-white/10">
              <div className="flex items-center justify-center py-2">
                <p>{localCoverImageCount}</p>
                <div className="grow" />
                <Btn size="small" onClick={() => setShowLocalCovers(!showLocalCovers)}>
                  {showLocalCovers ? t('ButtonHide') : t('ButtonShow')}
                </Btn>
              </div>

              {showLocalCovers && (
                <div className="flex flex-wrap items-center justify-center pb-2">
                  {localCovers.map((localCoverFile) => (
                    <div
                      key={localCoverFile.ino}
                      className={mergeClasses(
                        'm-0.5 mb-5 border-2',
                        isPendingUpdate ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-yellow-300',
                        localCoverFile.metadata.path === coverPath ? 'border-yellow-300' : 'border-transparent'
                      )}
                      onClick={isPendingUpdate ? undefined : () => handleSetCover(localCoverFile)}
                    >
                      <div className="bg-primary h-24" style={{ width: 96 / bookCoverAspectRatio + 'px' }}>
                        <PreviewCover
                          src={localCoverFile.localPath || ''}
                          width={96 / bookCoverAspectRatio}
                          bookCoverAspectRatio={bookCoverAspectRatio}
                          showResolution={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submitSearchForm}>
        <div className="-mx-1 flex flex-wrap items-center justify-start sm:flex-nowrap">
          <div className="w-48 grow p-1">
            <Dropdown
              value={provider}
              items={providers}
              disabled={searchInProgress}
              label={t('LabelProvider')}
              size="small"
              onChange={(val) => setProvider(String(val))}
            />
          </div>
          <div className="w-72 grow p-1">
            <TextInput
              value={searchTitle}
              onChange={setSearchTitle}
              disabled={searchInProgress}
              label={searchTitleLabel}
              placeholder={t('PlaceholderSearch')}
            />
          </div>
          {provider !== 'itunes' && provider !== 'audiobookcovers' && (
            <div className="w-72 grow p-1">
              <TextInput value={searchAuthor} onChange={setSearchAuthor} disabled={searchInProgress} label={t('LabelAuthor')} />
            </div>
          )}
          {!searchInProgress ? (
            <Btn className="ms-1 mt-5 px-4 md:min-w-24" type="submit">
              {t('ButtonSearch')}
            </Btn>
          ) : (
            <Btn className="ms-1 mt-5 px-4 md:min-w-24" type="button" color="bg-error" onClick={cancelSearch}>
              {t('ButtonCancel')}
            </Btn>
          )}
        </div>
      </form>

      {hasSearched && (
        <div className="mt-2 flex max-w-full flex-wrap items-center justify-center sm:max-h-80 sm:overflow-y-scroll">
          {searchInProgress && !coversFound.length ? (
            <p className="text-foreground-muted py-4">{t('MessageLoading')}</p>
          ) : !searchInProgress && !coversFound.length ? (
            <p className="text-foreground-muted py-4">{t('MessageNoCoversFound')}</p>
          ) : (
            coversFound.map((cover) => (
              <div
                key={cover}
                className={mergeClasses(
                  'm-0.5 mb-5 border-2',
                  isPendingUpdate ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-yellow-300',
                  cover === coverPath ? 'border-yellow-300' : 'border-transparent'
                )}
                onClick={isPendingUpdate ? undefined : () => handleCoverClick(cover)}
              >
                <PreviewCover src={cover} width={80} bookCoverAspectRatio={bookCoverAspectRatio} />
              </div>
            ))
          )}
        </div>
      )}

      {previewUpload && (
        <div className="bg-bg absolute top-0 left-0 z-10 h-full w-full p-8">
          <p className="text-lg">{t('HeaderPreviewCover')}</p>
          <span className="material-symbols absolute top-4 right-4 cursor-pointer text-2xl" onClick={resetCoverPreview}>
            close
          </span>
          <div className="flex justify-center py-4">
            <PreviewCover src={previewUpload} width={240} bookCoverAspectRatio={bookCoverAspectRatio} />
          </div>
          <div className="absolute right-0 bottom-0 flex px-5 py-4">
            <Btn disabled={isPendingUpload} className="mx-2" onClick={resetCoverPreview}>
              {t('ButtonReset')}
            </Btn>
            <Btn loading={isPendingUpload} color="bg-success" onClick={submitCoverUpload}>
              {t('ButtonUpload')}
            </Btn>
          </div>
        </div>
      )}

      {/* Cover Preview Modal */}
      <CoverPreviewModal
        isOpen={!!selectedCoverForPreview}
        selectedCover={selectedCoverForPreview}
        bookCoverAspectRatio={bookCoverAspectRatio}
        onClose={handleCloseCoverPreview}
        onApply={handleApplyCover}
      />
    </div>
  )
}
