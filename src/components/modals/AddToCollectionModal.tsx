'use client'

import { addBookToCollectionAction, createCollectionAction, removeBookFromCollectionAction } from '@/app/actions/collectionActions'
import { fetchCollectionsAction } from '@/app/actions/libraryActions'
import Modal from '@/components/modals/Modal'
import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import Tooltip from '@/components/ui/Tooltip'
import CollectionGroupCover from '@/components/widgets/media-card/CollectionGroupCover'
import { useBookCoverAspectRatio } from '@/contexts/LibraryContext'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { ApiError } from '@/lib/apiErrors'
import type { Collection } from '@/types/api'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CollectionRow = Collection & { isBookIncluded: boolean }

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  libraryId: string
  libraryItemId: string
  itemTitle: string
}

function collectionHasItem(collection: Collection, libraryItemId: string) {
  return collection.books?.some((b) => b.id === libraryItemId) ?? false
}

export default function AddToCollectionModal({ isOpen, onClose, libraryId, libraryItemId, itemTitle }: AddToCollectionModalProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const bookCoverAspectRatio = useBookCoverAspectRatio()
  /** Full-modal overlay only while loading the collections list */
  const [loadingInitial, setLoadingInitial] = useState(true)
  /** Add/remove/create disables controls without the modal processing overlay. */
  const [isMutating, setIsMutating] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [newCollectionName, setNewCollectionName] = useState('')

  const coverWidth = 80
  const coverHeight = 40 * bookCoverAspectRatio

  const sortedCollections = useMemo((): CollectionRow[] => {
    return [...collections]
      .map(
        (c): CollectionRow => ({
          ...c,
          isBookIncluded: collectionHasItem(c, libraryItemId)
        })
      )
      .sort((a, b) => {
        if (a.isBookIncluded !== b.isBookIncluded) {
          return a.isBookIncluded ? -1 : 1
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
  }, [collections, libraryItemId])

  /**
   * Load list only when the modal opens or the library changes
   */
  useEffect(() => {
    if (!isOpen) return
    setCollections([])
    setNewCollectionName('')
    setLoadingInitial(true)
    let cancelled = false
    void (async () => {
      try {
        // TODO: This matches the legacy Vue implement, but we should be using pagination
        const res = await fetchCollectionsAction(libraryId, '')
        if (!cancelled) setCollections(res.results)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load collections', error)
          showToast(t('ToastFailedToLoadData'), { type: 'error' })
          setCollections([])
        }
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, libraryId, showToast, t])

  const mergeUpdatedCollection = useCallback((updated: Collection) => {
    setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  const handleAdd = useCallback(
    (collection: Collection) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await addBookToCollectionAction(collection.id, libraryItemId)
          mergeUpdatedCollection(updated)
        } catch (error) {
          console.error('Failed to add book to collection', error)
          showToast(t('ToastCollectionItemsAddFailed'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [libraryItemId, mergeUpdatedCollection, showToast, t]
  )

  const handleRemove = useCallback(
    (collection: Collection) => {
      setIsMutating(true)
      void (async () => {
        try {
          const updated = await removeBookFromCollectionAction(collection.id, libraryItemId)
          mergeUpdatedCollection(updated)
        } catch (error) {
          console.error('Failed to remove book from collection', error)
          showToast(t('ToastRemoveFailed'), { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [libraryItemId, mergeUpdatedCollection, showToast, t]
  )

  const handleCreateCollection = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const name = newCollectionName.trim()
      if (!name) {
        return
      }
      setIsMutating(true)
      void (async () => {
        try {
          const created = await createCollectionAction({
            libraryId,
            name,
            books: [libraryItemId]
          })
          setCollections((prev) => {
            if (prev.some((c) => c.id === created.id)) {
              return prev.map((c) => (c.id === created.id ? created : c))
            }
            return [...prev, created]
          })
          setNewCollectionName('')
        } catch (error) {
          console.error('Failed to create collection', error)
          const message = error instanceof ApiError ? error.message : t('ToastFailedToUpdate')
          showToast(message, { type: 'error' })
        } finally {
          setIsMutating(false)
        }
      })()
    },
    [libraryId, libraryItemId, newCollectionName, showToast, t]
  )

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="max-w-[calc(100vw-4rem)] truncate text-xl font-semibold text-white" title={itemTitle}>
        {itemTitle}
      </p>
    </div>
  )

  const controlsDisabled = loadingInitial || isMutating

  return (
    <Modal isOpen={isOpen} onClose={onClose} processing={loadingInitial} outerContent={outerContent} className="max-w-lg sm:max-w-lg md:max-w-lg lg:max-w-lg">
      <div className="max-h-[80vh] w-full overflow-x-hidden overflow-y-auto rounded-lg">
        {isOpen && (
          <>
            <div className="px-4 pt-4 pb-2">
              <h1 className="text-lg font-semibold">{t('LabelAddToCollection')}</h1>
            </div>

            <div className="max-h-96 w-full overflow-x-hidden overflow-y-auto pt-4 pb-2">
              <div>
                {sortedCollections.map((collection) => {
                  const included = collection.isBookIncluded
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
                            className="bg-error text-white h-9 min-w-10 px-3"
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
                            className="bg-success text-white h-9 min-w-10 px-3"
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
                  <div className="text-foreground-muted flex items-center justify-center text-sm">
                    <p>{t('MessageBookshelfNoCollectionsHelp')}</p>
                    <Tooltip text={t('LabelClickForMoreInfo')} className="ms-2 inline-flex">
                      <a href="https://www.audiobookshelf.org/guides/collections" target="_blank" rel="noreferrer" className="inline-flex">
                        <span className="material-symbols text-xl">help_outline</span>
                      </a>
                    </Tooltip>
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
