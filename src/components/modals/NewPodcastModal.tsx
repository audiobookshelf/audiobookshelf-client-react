'use client'

import { createPodcastAction } from '@/app/(main)/library/[library]/(podcast)/add-podcast/actions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import TextareaInput from '@/components/ui/TextareaInput'
import TextInput from '@/components/ui/TextInput'
import { useLibrary } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { sanitizeFileName } from '@/lib/fileUtils'
import { PodcastSearchResult, RssPodcast } from '@/types/api'
import path from 'path'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'

interface NewPodcastFormState {
  title: string
  author: string
  description: string
  releaseDate: string
  genres: string[]
  feedUrl: string
  imageUrl: string
  itunesPageUrl: string
  itunesId: string
  itunesArtistId: string
  autoDownloadEpisodes: boolean
  language: string
  explicit: boolean
  type: string
}

const emptyFormState = (): NewPodcastFormState => ({
  title: '',
  author: '',
  description: '',
  releaseDate: '',
  genres: [],
  feedUrl: '',
  imageUrl: '',
  itunesPageUrl: '',
  itunesId: '',
  itunesArtistId: '',
  autoDownloadEpisodes: false,
  language: '',
  explicit: false,
  type: 'episodic'
})

function normalizeGenres(genres: PodcastSearchResult['genres']): string[] {
  if (!genres) return []
  if (Array.isArray(genres)) return genres
  return genres
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
}

function parseExplicitFromFeed(explicit: string | undefined): boolean {
  if (!explicit) return false
  return explicit === 'yes' || explicit === 'true'
}

export interface NewPodcastModalProps {
  isOpen: boolean
  podcastData: PodcastSearchResult | null
  podcastFeedData: RssPodcast | null
  onClose: () => void
  onCreated?: (libraryItemId: string) => void
}

export default function NewPodcastModal({ isOpen, podcastData, podcastFeedData, onClose, onCreated }: NewPodcastModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const { library } = useLibrary()
  const [isPending, startTransition] = useTransition()

  const [podcast, setPodcast] = useState<NewPodcastFormState>(emptyFormState)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [fullPath, setFullPath] = useState('')

  const folderItems = useMemo<DropdownItem[]>(
    () =>
      (library.folders ?? []).map((fold) => ({
        value: fold.id,
        text: fold.fullPath
      })),
    [library.folders]
  )

  const podcastTypeItems = useMemo<DropdownItem[]>(
    () => [
      { text: t('LabelEpisodic'), value: 'episodic' },
      { text: t('LabelSerial'), value: 'serial' }
    ],
    [t]
  )

  const modalTitle = podcastData?.title || podcastFeedData?.metadata?.title || ''

  const updateFullPath = useCallback(
    (title: string, folderId: string) => {
      const folder = library.folders?.find((f) => f.id === folderId)
      if (!folder?.fullPath || !title) {
        setFullPath('')
        return
      }
      setFullPath(path.join(folder.fullPath, sanitizeFileName(title)))
    },
    [library.folders]
  )

  const initForm = useCallback(() => {
    const feedMetadata = podcastFeedData?.metadata
    const genres = podcastData?.genres ? normalizeGenres(podcastData.genres) : feedMetadata?.categories || []

    const next: NewPodcastFormState = {
      title: podcastData?.title || feedMetadata?.title || '',
      author: podcastData?.artistName || feedMetadata?.author || '',
      description: podcastData?.description || feedMetadata?.descriptionPlain || '',
      releaseDate: podcastData?.releaseDate || '',
      genres,
      feedUrl: podcastData?.feedUrl || feedMetadata?.feedUrl || '',
      imageUrl: podcastData?.cover || feedMetadata?.image || '',
      itunesPageUrl: podcastData?.pageUrl || '',
      itunesId: podcastData?.id != null ? String(podcastData.id) : '',
      itunesArtistId: '',
      language: podcastData?.language || feedMetadata?.language || '',
      autoDownloadEpisodes: false,
      type: feedMetadata?.type || 'episodic',
      explicit: !!podcastData?.explicit || parseExplicitFromFeed(feedMetadata?.explicit)
    }

    setPodcast(next)

    const defaultFolderId = library.folders?.[0]?.id ?? ''
    setSelectedFolderId(defaultFolderId)
    updateFullPath(next.title, defaultFolderId)
  }, [library.folders, podcastData, podcastFeedData, updateFullPath])

  useEffect(() => {
    if (isOpen) {
      initForm()
    }
  }, [isOpen, initForm])

  const handleTitleChange = useCallback(
    (title: string) => {
      setPodcast((prev) => ({ ...prev, title }))
      updateFullPath(title, selectedFolderId)
    },
    [selectedFolderId, updateFullPath]
  )

  const handleFolderChange = useCallback(
    (folderId: string | number) => {
      const id = String(folderId)
      setSelectedFolderId(id)
      updateFullPath(podcast.title, id)
    },
    [podcast.title, updateFullPath]
  )

  const genreItems = useMemo<MultiSelectItem<string>[]>(() => podcast.genres.map((g) => ({ value: g, content: g })), [podcast.genres])

  const handleAddGenre = useCallback((item: MultiSelectItem<string>) => {
    setPodcast((prev) => {
      if (prev.genres.includes(item.content)) return prev
      return { ...prev, genres: [...prev.genres, item.content] }
    })
  }, [])

  const handleRemoveGenre = useCallback((item: MultiSelectItem<string>) => {
    setPodcast((prev) => ({ ...prev, genres: prev.genres.filter((g) => g !== item.value) }))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!fullPath || !selectedFolderId) {
      showToast(t('ToastPodcastCreateFailed'), { type: 'error' })
      return
    }

    const podcastPayload = {
      path: fullPath,
      folderId: selectedFolderId,
      libraryId: library.id,
      media: {
        metadata: {
          title: podcast.title,
          author: podcast.author,
          description: podcast.description,
          releaseDate: podcast.releaseDate,
          genres: [...podcast.genres],
          feedUrl: podcast.feedUrl,
          imageUrl: podcast.imageUrl,
          itunesPageUrl: podcast.itunesPageUrl,
          itunesId: podcast.itunesId,
          itunesArtistId: podcast.itunesArtistId,
          language: podcast.language,
          explicit: podcast.explicit,
          type: podcast.type
        },
        autoDownloadEpisodes: podcast.autoDownloadEpisodes
      }
    }

    startTransition(async () => {
      try {
        const libraryItem = await createPodcastAction(podcastPayload)
        showToast(t('ToastPodcastCreateSuccess'), { type: 'success' })
        onCreated?.(libraryItem.id)
        onClose()
      } catch (error) {
        console.error('Failed to create podcast', error)
        const message = error instanceof Error ? error.message : t('ToastPodcastCreateFailed')
        showToast(message, { type: 'error' })
      }
    })
  }, [fullPath, library.id, onClose, onCreated, podcast, selectedFolderId, showToast, t])

  const outerContent = (
    <div className="absolute start-0 top-0 max-w-[75%] p-4">
      <h2 className="truncate text-xl text-white">{modalTitle}</h2>
    </div>
  )

  const pathLabel = `${t('LabelPodcast')} ${t('LabelPath')}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={isPending} outerContent={outerContent}>
      <div className="flex max-h-[90vh] flex-col">
        <div className="space-y-2 overflow-y-auto px-4 py-6 sm:px-6">
          {podcast.imageUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={podcast.imageUrl} alt="" className="h-16 w-16 object-contain" />
            </div>
          ) : null}

          <div className="grid gap-2 md:grid-cols-2">
            <TextInput label={t('LabelTitle')} value={podcast.title} onChange={handleTitleChange} />
            <TextInput label={t('LabelAuthor')} value={podcast.author} onChange={(author) => setPodcast((prev) => ({ ...prev, author }))} />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <TextInput label={t('LabelFeedURL')} value={podcast.feedUrl} readOnly />
            <MultiSelect
              label={t('LabelGenres')}
              selectedItems={genreItems}
              items={genreItems}
              onItemAdded={handleAddGenre}
              onItemRemoved={handleRemoveGenre}
              allowNew
            />
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <Dropdown
              label={t('LabelPodcastType')}
              value={podcast.type}
              items={podcastTypeItems}
              className="w-full"
              onChange={(type) => setPodcast((prev) => ({ ...prev, type: String(type) }))}
            />
            <TextInput label={t('LabelLanguage')} value={podcast.language} onChange={(language) => setPodcast((prev) => ({ ...prev, language }))} />
            <div className="flex items-end">
              <Checkbox
                value={podcast.explicit}
                onChange={(explicit) => setPodcast((prev) => ({ ...prev, explicit }))}
                label={t('LabelExplicit')}
                checkboxBgClass="bg-primary"
                labelClass="ps-2 text-base font-semibold"
              />
            </div>
          </div>

          <TextareaInput
            label={t('LabelDescription')}
            value={podcast.description}
            rows={3}
            onChange={(description) => setPodcast((prev) => ({ ...prev, description }))}
          />

          <div className="grid gap-2 md:grid-cols-2">
            <Dropdown label={t('LabelFolder')} value={selectedFolderId} items={folderItems} disabled={isPending} onChange={handleFolderChange} />
            <TextInput label={pathLabel} value={fullPath} readOnly customInputClass="truncate" />
          </div>
        </div>

        <div className="border-border border-t px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
            <Checkbox
              value={podcast.autoDownloadEpisodes}
              onChange={(autoDownloadEpisodes) => setPodcast((prev) => ({ ...prev, autoDownloadEpisodes }))}
              label={t('LabelAutoDownloadEpisodes')}
              checkboxBgClass="bg-primary"
              labelClass="ps-2 text-sm font-semibold md:text-base"
            />
            <Btn disabled={isPending} loading={isPending} onClick={handleSubmit}>
              {t('ButtonSubmit')}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
