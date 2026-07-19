'use client'

import { batchAddBooksToCollectionAction, batchRemoveBooksFromCollectionAction } from '@/app/actions/batchActions'
import { createCollectionAction } from '@/app/actions/collectionActions'
import { fetchCollectionsAction } from '@/app/actions/libraryActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import MoreInfoIcon from '@/components/ui/MoreInfoIcon'
import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiError } from '@/lib/apiErrors'
import type { Collection } from '@/types/api'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CollectionRow = Collection & { allBooksIncluded: boolean }

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  libraryId: string
  libraryItemIds: string[]
  /** Single-item outer header title; ignored when multiple items are selected */
  itemTitle?: string
}

function collectionIncludesAllBooks(collection: Collection, libraryItemIds: readonly string[]) {
  const collectionBookIds = new Set((collection.books ?? []).map((book) => book.id))
  return libraryItemIds.every((id) => collectionBookIds.has(id))
}

export default function AddToCollectionModal({ isOpen, onClose, libraryId, libraryItemIds, itemTitle }: AddToCollectionModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [newCollectionName, setNewCollectionName] = useState('')
  const loadedLibraryIdRef = useRef<string | null>(null)
  const showToastRef = useRef(showToast)
  const tRef = useRef(t)
  showToastRef.current = showToast
  tRef.current = t

  const coverWidth = 80
  const coverHeight = 40 * bookCoverAspectRatio
  const isBatch = libraryItemIds.length > 1
  const selectedCount = libraryItemIds.length

  const sortedCollections = useMemo((): CollectionRow[] => {
    return [...collections]
      .map(
        (collection): CollectionRow => ({
          ...collection,
          allBooksIncluded: collectionIncludesAllBooks(collection, libraryItemIds)
        })
      )
      .sort((a, b) => {
        if (a.allBooksIncluded !== b.allBooksIncluded) {
          return a.allBooksIncluded ? -1 : 1
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
  }, [collections, libraryItemIds])

  useEffect(() => {
    if (!isOpen) {
      loadedLibraryIdRef.current = null
      return
    }

    const isFreshOpen = loadedLibraryIdRef.current !== libraryId
    loadedLibraryIdRef.current = libraryId

    if (isFreshOpen) {
      setCollections([])
      setNewCollectionName('')
      setLoadingInitial(true)
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetchCollectionsAction(libraryId, '')
        if (!cancelled) setCollections(res.results)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load collections', error)
          showToastRef.current(tRef.current('ToastFailedToLoadData'), { type: 'error' })
          if (isFreshOpen) setCollections([])
        }
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, libraryId])

  const mergeUpdatedCollection = useCallback((updated: Collection) => {
    setCollections((prev) => prev.map((collection) => (collection.id === updated.id ? updated : collection)))
  }, [])

  const handleAdd = useCallback(
    (collection: Collection) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await batchAddBooksToCollectionAction(collection.id, [...libraryItemIds])
          mergeUpdatedCollection(updated)
          if (isBatch) showToast(t('ToastCollectionUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to add books to collection', error)
          showToast(t('ToastCollectionItemsAddFailed'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, libraryItemIds, mergeUpdatedCollection, showToast, t]
  )

  const handleRemove = useCallback(
    (collection: Collection) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await batchRemoveBooksFromCollectionAction(collection.id, [...libraryItemIds])
          mergeUpdatedCollection(updated)
          if (isBatch) showToast(t('ToastCollectionUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to remove books from collection', error)
          showToast(t('ToastRemoveFailed'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, libraryItemIds, mergeUpdatedCollection, showToast, t]
  )

  const handleCreateCollection = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const name = newCollectionName.trim()
      if (!name) return

      setIsMutating(true)
      void (async () => {
        try {
          const created = await createCollectionAction({
            libraryId,
            name,
            books: [...libraryItemIds]
          })
          setCollections((prev) => {
            if (prev.some((collection) => collection.id === created.id)) {
              return prev.map((collection) => (collection.id === created.id ? created : collection))
            }
            return [...prev, created]
          })
          setNewCollectionName('')
          if (isBatch) showToast(t('ToastCollectionUpdateSuccess'), { type: 'success' })
        } catch (error) {
          console.error('Failed to create collection', error)
          const message = error instanceof ApiError ? error.message : t('ToastFailedToUpdate')
          showToast(message, { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [isBatch, libraryId, libraryItemIds, newCollectionName, showToast, t]
  )

  const outerHeaderText = isBatch ? t('MessageBooksSelected', { count: selectedCount }) : (itemTitle ?? '')

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="max-w-[calc(100vw-4rem)] truncate text-xl font-semibold text-white" title={outerHeaderText}>
        {outerHeaderText}
      </p>
    </div>
  )

  const controlsDisabled = loadingInitial || isMutating

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      processing={loadingInitial && collections.length === 0}
      outerContent={outerContent}
      className="max-w-lg sm:max-w-lg md:max-w-lg lg:max-w-lg"
    >
      <div className="max-h-[80vh] w-full overflow-x-hidden overflow-y-auto rounded-lg">
        {isOpen && (
          <>
            <div className="px-4 pt-4 pb-2">
              <h1 className="text-lg font-semibold">{isBatch ? t('LabelAddToCollectionBatch', { 0: selectedCount }) : t('LabelAddToCollection')}</h1>
            </div>

            <div className="max-h-96 w-full overflow-x-hidden overflow-y-auto pt-4 pb-2">
              <div>
                {sortedCollections.map((collection) => {
                  const included = collection.allBooksIncluded
                  const books = collection.books ?? []
                  return (
                    <div key={collection.id} className="hover:bg-dropdown-item-hover relative flex items-center justify-start px-4 py-2">
                      {included && <div className="bg-success absolute start-0 top-0 z-10 h-full w-1" aria-hidden />}
                      <div className="w-20 max-w-20 shrink-0 text-center">
                        <CollectionGroupCover books={books} width={coverWidth} height={coverHeight} />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden px-2">
                        <Link
                          href={`/library/${libraryId}/collection/${collection.id}`}
                          className="cursor-pointer truncate ps-2 pe-2 hover:underline"
                          onClick={() => onClose()}
                        >
                          {collection.name}
                        </Link>
                      </div>
                      <div className="flex h-full shrink-0 items-center justify-end ps-2">
                        {included ? (
                          <IconBtn
                            ariaLabel={t('ButtonRemove')}
                            size="auto"
                            outlined={false}
                            className="bg-error h-9 min-w-10 px-3 text-white"
                            disabled={controlsDisabled}
                            onClick={() => handleRemove(collection)}
                          >
                            remove
                          </IconBtn>
                        ) : (
                          <IconBtn
                            ariaLabel={t('ButtonAdd')}
                            size="auto"
                            outlined={false}
                            className="bg-success h-9 min-w-10 px-3 text-white"
                            disabled={controlsDisabled}
                            onClick={() => handleAdd(collection)}
                          >
                            add
                          </IconBtn>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {!loadingInitial && collections.length === 0 && (
              <div className="flex h-32 items-center justify-center px-4 text-center sm:px-6">
                <div>
                  <p className="mb-2 text-xl">{t('MessageNoCollections')}</p>
                  <div className="text-foreground-muted flex items-center justify-center gap-2 text-sm">
                    <p>{t('MessageBookshelfNoCollectionsHelp')}</p>
                    <MoreInfoIcon moreInfoUrl="https://www.audiobookshelf.org/guides/collections" size="xl" />
                  </div>
                </div>
              </div>
            )}

            <div className="border-border h-px w-full border-t" />

            <form onSubmit={handleCreateCollection}>
              <div className="flex items-center px-4 py-2 text-center">
                <div className="grow px-2">
                  <TextInput
                    value={newCollectionName}
                    placeholder={t('PlaceholderNewCollection')}
                    onChange={setNewCollectionName}
                    disabled={controlsDisabled}
                    className="w-full"
                  />
                </div>
                <Btn type="submit" color="bg-success" size="small" className="h-10 shrink-0" disabled={controlsDisabled || !newCollectionName.trim()}>
                  {t('ButtonCreate')}
                </Btn>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
