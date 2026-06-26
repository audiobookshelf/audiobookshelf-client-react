'use client'

import { removeCoverAction, setCoverFromLocalFileAction, updateCoverFromUrlAction } from '@/app/actions/coverActions'
import PreviewCover from '@/components/covers/PreviewCover'
import CoverPreviewModal from '@/components/modals/CoverPreviewModal'
import Btn from '@/components/ui/Btn'
import Dropdown from '@/components/ui/Dropdown'
import FileInput from '@/components/ui/FileInput'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useBookCoverProviders, useMetadata, usePodcastCoverProviders } from '@/contexts/MetadataContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useCoverSearch } from '@/hooks/useCoverSearch'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { uploadCoverFile } from '@/lib/coverUpload'
import { getLibraryFileUrl, getLibraryItemCoverUrl, getPlaceholderCoverUrl } from '@/lib/coverUtils'
import { mergeClasses } from '@/lib/merge-classes'
import { BookLibraryItem, LibraryFile, PodcastLibraryItem } from '@/types/api'
import React, { useEffect, useMemo, useState, useTransition } from 'react'

interface LocalCover extends LibraryFile {
  localPath: string
}

interface CoverEditProps {
  libraryItem: BookLibraryItem | PodcastLibraryItem
}

export default function CoverEdit({ libraryItem }: CoverEditProps) {
  const bookCoverAspectRatio = useBookCoverAspectRatio()
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
          localPath: getLibraryFileUrl(libraryItem.id, file.ino, libraryItem.updatedAt)
        })
      )
  }, [libraryItem.libraryFiles, libraryItem.id, libraryItem.updatedAt])

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
  }, [libraryItem.id, libraryItem.media?.metadata, isPodcast, resetSearch])

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
        await uploadCoverFile(libraryItem.id, fileToUpload)
        showToast(t('ToastItemCoverUpdateSuccess'), { type: 'success' })
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
        showToast(t('ToastItemCoverUpdateSuccess'), { type: 'success' })
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
        showToast(t('ToastItemCoverUpdateSuccess'), { type: 'success' })
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
        showToast(t('ToastItemCoverUpdateSuccess'), { type: 'success' })
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

  const showAuthorField = provider !== 'itunes' && provider !== 'audiobookcovers'

  return (
    <div className="relative w-full space-y-6 px-2 py-6 md:px-4">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[auto_1fr] md:gap-6">
        <div className="relative justify-self-center md:justify-self-start">
          <PreviewCover src={coverUrl} width={120} />

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

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {userCanUpload && (
              <FileInput size="small" onChange={fileUploadSelected} className="shrink-0">
                {t('ButtonUploadCover')}
              </FileInput>
            )}

            <form onSubmit={submitForm} className="flex min-w-0 flex-1 items-center gap-2">
              <TextInput
                size="small"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder={t('LabelImageURLFromTheWeb')}
                className="min-w-0 flex-1"
                disabled={isPendingUpdate}
              />
              <Btn size="small" color="bg-success" type="submit" disabled={!imageUrl || isPendingUpdate} loading={isPendingUpdate} className="w-24 shrink-0">
                {t('ButtonSubmit')}
              </Btn>
            </form>
          </div>

          {localCovers.length > 0 && (
            <div className="border-t border-b border-white/10">
              <div className="flex items-center justify-between py-2 ps-2">
                <p>{localCoverImageCount}</p>
                <Btn size="small" onClick={() => setShowLocalCovers(!showLocalCovers)}>
                  {showLocalCovers ? t('ButtonHide') : t('ButtonShow')}
                </Btn>
              </div>

              {showLocalCovers && (
                <div className="flex flex-wrap items-center justify-center gap-1 px-2 pb-2 md:px-1">
                  {localCovers.map((localCoverFile) => (
                    <div
                      key={localCoverFile.ino}
                      className={mergeClasses(
                        'border-2',
                        isPendingUpdate ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-yellow-300',
                        localCoverFile.metadata.path === coverPath ? 'border-yellow-300' : 'border-transparent'
                      )}
                      onClick={isPendingUpdate ? undefined : () => handleSetCover(localCoverFile)}
                    >
                      <div className="bg-primary h-24" style={{ width: 96 / bookCoverAspectRatio + 'px' }}>
                        <PreviewCover src={localCoverFile.localPath || ''} width={96 / bookCoverAspectRatio} showResolution={false} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={submitSearchForm} className="flex flex-wrap items-end gap-2">
        <Dropdown
          value={provider}
          items={providers}
          disabled={searchInProgress}
          label={t('LabelProvider')}
          size="small"
          className="w-full min-w-40 shrink-0 md:w-48"
          onChange={(val) => setProvider(String(val))}
        />
        <TextInput
          size="small"
          value={searchTitle}
          onChange={setSearchTitle}
          disabled={searchInProgress}
          label={searchTitleLabel}
          placeholder={t('PlaceholderSearch')}
          className="min-w-0 grow basis-48"
        />
        {showAuthorField && (
          <TextInput
            size="small"
            value={searchAuthor}
            onChange={setSearchAuthor}
            disabled={searchInProgress}
            label={t('LabelAuthor')}
            className="min-w-0 grow basis-48"
          />
        )}
        {searchInProgress ? (
          <Btn
            size="small"
            type="button"
            color="bg-error"
            onClick={(e) => {
              e.preventDefault()
              cancelSearch()
            }}
            className="w-24 shrink-0"
          >
            {t('ButtonCancel')}
          </Btn>
        ) : (
          <Btn size="small" type="submit" className="w-24 shrink-0">
            {t('ButtonSearch')}
          </Btn>
        )}
      </form>

      {hasSearched && (
        <div className="flex max-w-full flex-wrap justify-center gap-1 md:max-h-80 md:overflow-y-auto">
          {searchInProgress && !coversFound.length ? (
            <p className="text-foreground-muted py-4">{t('MessageLoading')}</p>
          ) : !searchInProgress && !coversFound.length ? (
            <p className="text-foreground-muted py-4">{t('MessageNoCoversFound')}</p>
          ) : (
            coversFound.map((cover) => (
              <div
                key={cover}
                className={mergeClasses(
                  'border-2',
                  isPendingUpdate ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-yellow-300',
                  cover === coverPath ? 'border-yellow-300' : 'border-transparent'
                )}
                onClick={isPendingUpdate ? undefined : () => handleCoverClick(cover)}
              >
                <PreviewCover src={cover} width={80} />
              </div>
            ))
          )}
        </div>
      )}

      <CoverPreviewModal
        isOpen={!!previewUpload}
        selectedCover={previewUpload}
        onClose={resetCoverPreview}
        onApply={submitCoverUpload}
        cancelLabel={t('ButtonReset')}
        applyLabel={t('ButtonUpload')}
        applyLoading={isPendingUpload}
        cancelDisabled={isPendingUpload}
      />

      <CoverPreviewModal
        isOpen={!!selectedCoverForPreview}
        selectedCover={selectedCoverForPreview}
        onClose={handleCloseCoverPreview}
        onApply={handleApplyCover}
      />
    </div>
  )
}
