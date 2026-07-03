'use client'

import { updateTracksAction } from '@/app/actions/trackActions'
import { getExpandedLibraryItemAction } from '@/app/actions/mediaActions'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { AudioFile, BookLibraryItem } from '@/types/api'
import { useCallback, useMemo, useState, useTransition } from 'react'

export type TrackSortKey = 'custom' | 'current' | 'track-filename' | 'metadata' | 'filename'

export interface EditableTrackFile extends AudioFile {
  include: boolean
}

function buildEditableFiles(audioFiles: AudioFile[]): EditableTrackFile[] {
  return audioFiles.map((af) => ({ ...af, include: !af.exclude }))
}

function buildInitialEditableFiles(audioFiles: AudioFile[]): EditableTrackFile[] {
  return sortByCurrent(buildEditableFiles(audioFiles))
}

/** O(n) preview of New column track numbers for included rows in current list order. */
export function buildNewTrackIndices(files: EditableTrackFile[]): (number | null)[] {
  const indices: (number | null)[] = []
  let includedCount = 0
  for (const file of files) {
    if (!file.include) {
      indices.push(null)
    } else {
      includedCount++
      indices.push(includedCount)
    }
  }
  return indices
}

/** Matches server AudioFileScanner: 1, 2, 3… with gaps of at most 1 between values. */
function isSequential(nums: number[]): boolean {
  if (!nums.length) return false
  if (nums.length === 1) return true
  let prev = nums[0]
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] - prev > 1) return false
    prev = nums[i]
  }
  return true
}

function compareNullableTrackAsc(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

function sortByDiscThenTrack(
  files: EditableTrackFile[],
  discKey: 'discNumFromMeta' | 'discNumFromFilename',
  trackKey: 'trackNumFromMeta' | 'trackNumFromFilename'
): EditableTrackFile[] {
  const next = [...files]
  const discs = files.map((f) => f[discKey]).filter((n): n is number => n != null)
  const sortedDiscs = [...discs].sort((a, b) => a - b)
  const useDiscSort = discs.length === files.length && isSequential(sortedDiscs)

  next.sort((a, b) => {
    if (useDiscSort) {
      const discDiff = (a[discKey] as number) - (b[discKey] as number)
      if (discDiff !== 0) return discDiff
    }
    return compareNullableTrackAsc(a[trackKey], b[trackKey])
  })
  return next
}

/** Keep the user's list order; merge exclude/index and other fields from the server response. */
function mergeEditableFilesPreservingOrder(currentFiles: EditableTrackFile[], serverAudioFiles: AudioFile[]): EditableTrackFile[] {
  const serverByIno = new Map(serverAudioFiles.map((af) => [af.ino, af]))
  return currentFiles
    .filter((f) => serverByIno.has(f.ino))
    .map((f) => {
      const server = serverByIno.get(f.ino)!
      return { ...server, include: !server.exclude }
    })
}

/** Sort included tracks by saved index; excluded rows keep their list position. */
function sortByCurrent(files: EditableTrackFile[]): EditableTrackFile[] {
  const includedSorted = [...files]
    .filter((f) => f.include)
    .sort((a, b) => {
      if (a.index == null) return 1
      if (b.index == null) return -1
      return a.index - b.index
    })

  let includedIndex = 0
  return files.map((file) => {
    if (!file.include) return file
    const next = includedSorted[includedIndex]
    includedIndex++
    return next ?? file
  })
}

function sortFiles(files: EditableTrackFile[], sortKey: TrackSortKey): EditableTrackFile[] {
  switch (sortKey) {
    case 'custom':
      return files
    case 'current':
      return sortByCurrent(files)
    case 'metadata':
      return sortByDiscThenTrack(files, 'discNumFromMeta', 'trackNumFromMeta')
    case 'track-filename':
      return sortByDiscThenTrack(files, 'discNumFromFilename', 'trackNumFromFilename')
    case 'filename':
      return [...files].sort((a, b) =>
        (a.metadata.filename || '').toLowerCase().localeCompare((b.metadata.filename || '').toLowerCase())
      )
    default:
      return files
  }
}

function serializeTrackState(files: EditableTrackFile[]): string {
  return files.map((f) => `${f.ino}:${f.include ? '1' : '0'}`).join('|')
}

interface UseTrackEditorOptions {
  initialLibraryItem: BookLibraryItem
}

export function useTrackEditor({ initialLibraryItem }: UseTrackEditorOptions) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()

  const [libraryItem] = useState(initialLibraryItem)
  const [savedFiles, setSavedFiles] = useState<EditableTrackFile[]>(() =>
    buildInitialEditableFiles(initialLibraryItem.media.audioFiles ?? [])
  )
  const [files, setFiles] = useState<EditableTrackFile[]>(() =>
    buildInitialEditableFiles(initialLibraryItem.media.audioFiles ?? [])
  )
  const [currentSort, setCurrentSort] = useState<TrackSortKey>('current')

  const title = libraryItem.media.metadata.title || 'No Title'
  const hasChanges = useMemo(() => serializeTrackState(files) !== serializeTrackState(savedFiles), [files, savedFiles])
  const newTrackIndices = useMemo(() => buildNewTrackIndices(files), [files])

  const handleSortEnd = useCallback((sortedItems: EditableTrackFile[]) => {
    setFiles(sortedItems)
    setCurrentSort('custom')
  }, [])

  const handleSort = useCallback((sortKey: TrackSortKey) => {
    setFiles((prev) => sortFiles(prev, sortKey))
    setCurrentSort(sortKey)
  }, [])

  const handleIncludeToggle = useCallback((ino: string, include: boolean) => {
    setFiles((prev) => prev.map((f) => (f.ino === ino ? { ...f, include } : f)))
  }, [])

  const handleReset = useCallback(() => {
    setFiles(savedFiles)
    setCurrentSort('current')
  }, [savedFiles])

  const handleSave = useCallback(() => {
    const filesAtSave = files
    const orderedFileData = filesAtSave.map((file) => ({
      index: file.index,
      filename: file.metadata.filename,
      ino: file.ino,
      exclude: !file.include
    }))

    startTransition(async () => {
      try {
        await updateTracksAction(libraryItem.id, orderedFileData)
        const refreshed = await getExpandedLibraryItemAction(libraryItem.id)
        if (refreshed.mediaType === 'book') {
          const saved = mergeEditableFilesPreservingOrder(filesAtSave, (refreshed as BookLibraryItem).media.audioFiles ?? [])
          setSavedFiles(saved)
          setFiles(saved)
          setCurrentSort('current')
        }
        showToast(t('ToastTracksUpdated'), { type: 'success' })
      } catch (error) {
        console.error('Failed to update tracks', error)
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }, [files, libraryItem.id, showToast, t])

  return {
    libraryItem,
    title,
    files,
    newTrackIndices,
    hasChanges,
    currentSort,
    isPending,
    handleSortEnd,
    handleSort,
    handleIncludeToggle,
    handleReset,
    handleSave
  }
}
