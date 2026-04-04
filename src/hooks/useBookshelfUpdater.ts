// Imported only from client modules — omitting "use client" avoids Next TS 71007 on hook option types (not suppressible via eslint-disable).

import { useSocketEvent } from '@/contexts/SocketContext'
import { getVisibleBookshelfPageRange, type VisibleBookshelfPageRangeInput } from '@/hooks/useBookshelfVirtualizer'
import { Author, AuthorRemovedPayload, BookshelfEntity, EntityType, LibraryItem, LibraryItemRemovedPayload } from '@/types/api'
import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react'

/** Like refs from `useRef` with a writable `current` (avoids deprecated `MutableRefObject` in newer `@types/react`). */
type RefBox<T> = { current: T }

type BookshelfReconcileLayout = VisibleBookshelfPageRangeInput & {
  items: (BookshelfEntity | null)[]
  shelfHeight: number
  containerHeight: number
}

function getPagesForReconcile(layout: BookshelfReconcileLayout, entityIds?: Iterable<string>): number[] {
  const { itemsPerPage, items } = layout
  const { startPage, endPage } = getVisibleBookshelfPageRange(layout)
  const pages = new Set<number>()
  for (let p = startPage; p <= endPage; p++) pages.add(p)
  for (const entityId of entityIds ?? []) {
    const indexInSparseList = items.findIndex((entity) => entity?.id === entityId)
    if (indexInSparseList >= 0) {
      pages.add(Math.floor(indexInSparseList / itemsPerPage))
    }
  }
  return [...pages].sort((a, b) => a - b)
}

type BookshelfUpdaterRuntime = {
  libraryId: string
  entityType: EntityType
  bookshelfLayoutReady: boolean
  reconcilePagesAfterUpdate: (pageIndices: number[], changedIds?: Set<string>) => Promise<{ total: number } | null>
  containerRef: RefObject<HTMLDivElement | null>
  layoutForReconcileRef: RefBox<BookshelfReconcileLayout>
  runScrollClampAfterReconcile: (reconcileResult: { total: number } | null, layoutWhenStarted: BookshelfReconcileLayout) => void
}

function reconcileThenClamp(rt: BookshelfUpdaterRuntime, pageIndices: number[], changedIds?: Set<string>) {
  if (!rt.bookshelfLayoutReady) return

  const layout = rt.layoutForReconcileRef.current

  const layoutWhenStarted = { ...layout }

  void rt
    .reconcilePagesAfterUpdate(pageIndices, changedIds)
    .then((reconcileResult) => rt.runScrollClampAfterReconcile(reconcileResult, layoutWhenStarted))
    .catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('useBookshelfUpdater: reconcile after update', error)
    })
}

function isEntityOnBookshelf(layout: BookshelfReconcileLayout, entityId: string): boolean {
  return layout.items.some((entity) => entity?.id === entityId)
}

/**
 * After updates: always at least visible pages (sort/total may change even when payload ids are
 * not in the sparse list). When any payload id is on shelf, also refetch those pages and pass `changedIds`
 * so same-slot same-id cells get fresh refs (see useBookshelfData).
 */
function reconcileUpdatedEntities(rt: BookshelfUpdaterRuntime, entities: { id: string }[]) {
  const layout = rt.layoutForReconcileRef.current
  const onShelf = entities.filter((e) => isEntityOnBookshelf(layout, e.id))
  const changedIds = onShelf.length > 0 ? new Set(onShelf.map((e) => e.id)) : undefined
  const pages = getPagesForReconcile(layout, changedIds)
  if (pages.length === 0) return
  reconcileThenClamp(rt, pages, changedIds)
}

/**
 * After add/remove: refetch visible pages only (total/order may change). Off-screen slots invalidate via
 * `pagesLoadedRef` when structure changes; they refetch on scroll. Omits `changedIds`; see useBookshelfData.
 */
function reconcileVisiblePages(rt: BookshelfUpdaterRuntime) {
  if (!rt.bookshelfLayoutReady) return
  const layout = rt.layoutForReconcileRef.current
  const pages = getPagesForReconcile(layout)
  if (pages.length === 0) return
  reconcileThenClamp(rt, pages)
}

export type UseBookshelfUpdaterParams = {
  entityType: EntityType
  libraryId: string
  containerRef: RefObject<HTMLDivElement | null>
  visibleShelfStart: number
  visibleShelfEnd: number
  columns: number
  itemsPerPage: number
  bookshelfLayoutReady: boolean
  fetchedTotal: number
  items: (BookshelfEntity | null)[]
  shelfHeight: number
  containerHeight: number
  reconcilePagesAfterUpdate: (pageIndices: number[], changedIds?: Set<string>) => Promise<{ total: number } | null>
  handleScroll: (scrollTop: number) => void
}

/**
 * Socket-driven bookshelf refresh: reconcile visible pages on list membership changes; visible + touched
 * pages on metadata updates.
 */
export function useBookshelfUpdater({
  entityType,
  libraryId,
  containerRef,
  visibleShelfStart,
  visibleShelfEnd,
  columns,
  itemsPerPage,
  bookshelfLayoutReady,
  fetchedTotal,
  items,
  shelfHeight,
  containerHeight,
  reconcilePagesAfterUpdate,
  handleScroll
}: UseBookshelfUpdaterParams): void {
  const layoutForReconcileRef = useRef<BookshelfReconcileLayout>({
    visibleShelfStart: 0,
    visibleShelfEnd: 0,
    columns: 0,
    itemsPerPage: 0,
    totalEntities: 0,
    items: [],
    shelfHeight: 0,
    containerHeight: 0
  })

  // Layout before socket listeners (useEffect) so the ref is never stale on the first event tick.
  useLayoutEffect(() => {
    layoutForReconcileRef.current = {
      visibleShelfStart,
      visibleShelfEnd,
      columns,
      itemsPerPage,
      totalEntities: fetchedTotal,
      items,
      shelfHeight,
      containerHeight
    }
  }, [visibleShelfStart, visibleShelfEnd, columns, itemsPerPage, fetchedTotal, items, shelfHeight, containerHeight])

  const runScrollClampAfterReconcile = useCallback(
    (reconcileResult: { total: number } | null, layoutWhenStarted: BookshelfReconcileLayout) => {
      if (!reconcileResult) return
      const scrollEl = containerRef.current
      if (!scrollEl || layoutWhenStarted.columns <= 0 || layoutWhenStarted.shelfHeight <= 0) return
      const totalShelvesAfter = Math.ceil(reconcileResult.total / layoutWhenStarted.columns)
      const maxScrollTop = Math.max(0, totalShelvesAfter * layoutWhenStarted.shelfHeight - layoutWhenStarted.containerHeight)
      if (scrollEl.scrollTop > maxScrollTop) {
        scrollEl.scrollTop = maxScrollTop
        handleScroll(maxScrollTop)
      }
    },
    [containerRef, handleScroll]
  )

  const runtimeRef = useRef<BookshelfUpdaterRuntime>({} as BookshelfUpdaterRuntime)
  runtimeRef.current = {
    libraryId,
    entityType,
    bookshelfLayoutReady,
    reconcilePagesAfterUpdate,
    containerRef,
    layoutForReconcileRef,
    runScrollClampAfterReconcile
  }

  const onLibraryItemUpdated = useCallback((libraryItem: LibraryItem) => {
    const rt = runtimeRef.current
    if (libraryItem.libraryId !== rt.libraryId || rt.entityType !== 'items') return
    reconcileUpdatedEntities(rt, [libraryItem])
  }, [])

  const onLibraryItemsUpdated = useCallback((libraryItems: LibraryItem[]) => {
    const rt = runtimeRef.current
    const inLibrary = libraryItems.filter((li) => li.libraryId === rt.libraryId)
    if (inLibrary.length === 0 || rt.entityType !== 'items') return
    reconcileUpdatedEntities(rt, inLibrary)
  }, [])

  const onLibraryItemAdded = useCallback((libraryItem: LibraryItem) => {
    const rt = runtimeRef.current
    if (libraryItem.libraryId !== rt.libraryId || rt.entityType !== 'items') return
    reconcileVisiblePages(rt)
  }, [])

  const onLibraryItemsAdded = useCallback((libraryItems: LibraryItem[]) => {
    const rt = runtimeRef.current
    if (!libraryItems.some((li) => li.libraryId === rt.libraryId) || rt.entityType !== 'items') return
    reconcileVisiblePages(rt)
  }, [])

  const onLibraryItemRemoved = useCallback((payload: LibraryItemRemovedPayload) => {
    const rt = runtimeRef.current
    if (payload.libraryId !== rt.libraryId || rt.entityType !== 'items') return
    reconcileVisiblePages(rt)
  }, [])

  const onAuthorUpdated = useCallback((author: Author) => {
    const rt = runtimeRef.current
    if ((author.libraryId !== undefined && author.libraryId !== rt.libraryId) || rt.entityType !== 'authors') return
    reconcileUpdatedEntities(rt, [author])
  }, [])

  const onAuthorAdded = useCallback((author: Author) => {
    const rt = runtimeRef.current
    if ((author.libraryId !== undefined && author.libraryId !== rt.libraryId) || rt.entityType !== 'authors') return
    reconcileVisiblePages(rt)
  }, [])

  const onAuthorRemoved = useCallback((payload: AuthorRemovedPayload) => {
    const rt = runtimeRef.current
    if (payload.libraryId !== rt.libraryId || rt.entityType !== 'authors') return
    reconcileVisiblePages(rt)
  }, [])

  useSocketEvent<LibraryItem>('item_updated', onLibraryItemUpdated, [onLibraryItemUpdated])
  useSocketEvent<LibraryItem[]>('items_updated', onLibraryItemsUpdated, [onLibraryItemsUpdated])
  useSocketEvent<LibraryItem>('item_added', onLibraryItemAdded, [onLibraryItemAdded])
  useSocketEvent<LibraryItem[]>('items_added', onLibraryItemsAdded, [onLibraryItemsAdded])
  useSocketEvent<LibraryItemRemovedPayload>('item_removed', onLibraryItemRemoved, [onLibraryItemRemoved])
  useSocketEvent<Author>('author_added', onAuthorAdded, [onAuthorAdded])
  useSocketEvent<Author>('author_updated', onAuthorUpdated, [onAuthorUpdated])
  useSocketEvent<AuthorRemovedPayload>('author_removed', onAuthorRemoved, [onAuthorRemoved])
}
