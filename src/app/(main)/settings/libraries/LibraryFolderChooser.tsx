'use client'

import { getFilesystemPaths } from '@/app/(main)/settings/libraries/actions'
import Btn from '@/components/ui/Btn'
import LoadingSpinner from '@/components/widgets/LoadingSpinner'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import { useCallback, useEffect, useState } from 'react'

interface DirectoryEntry {
  path: string
  dirname: string
  level: number
}

interface DirectoryEntryDisplay extends DirectoryEntry {
  isUsed: boolean
  isSelected: boolean
  className: string
}

interface LibraryFolderChooserProps {
  /** Already-assigned folder paths (will be marked as unavailable) */
  paths: string[]
  /** Called when user selects a folder path */
  onSelect: (path: string) => void
  /** Called when user clicks the back arrow to dismiss the chooser */
  onBack: () => void
}

export default function LibraryFolderChooser({ paths, onSelect, onBack }: LibraryFolderChooserProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()

  const [initialLoad, setInitialLoad] = useState(false)
  const [loadingDirs, setLoadingDirs] = useState(false)
  const [isPosix, setIsPosix] = useState(true)
  const [rootDirs, setRootDirs] = useState<DirectoryEntry[]>([])
  const [directories, setDirectories] = useState<DirectoryEntry[]>([])
  const [selectedPath, setSelectedPath] = useState('')
  const [subdirs, setSubdirs] = useState<DirectoryEntry[]>([])
  const [level, setLevel] = useState(0)

  // Fetch directories via server action
  const fetchDirs = useCallback(
    async (path: string, dirLevel: number): Promise<DirectoryEntry[]> => {
      setLoadingDirs(true)
      try {
        const data = await getFilesystemPaths(path, dirLevel)
        setIsPosix(!!data.posix)
        return data.directories || []
      } catch (error) {
        console.error('Failed to get filesystem paths', error)
        showToast(t('ToastFailedToLoadData'), { type: 'error' })
        return []
      } finally {
        setLoadingDirs(false)
      }
    },
    [showToast, t]
  )

  // Initialize on mount
  useEffect(() => {
    let cancelled = false

    async function init() {
      setInitialLoad(true)
      const dirs = await fetchDirs('', 0)
      if (cancelled) return
      setInitialLoad(false)
      setRootDirs(dirs)
      setDirectories(dirs)
      setSubdirs([])
      setSelectedPath('')
    }

    init()
    return () => {
      cancelled = true
    }
  }, [fetchDirs])

  // Compute display directories with used/selected styling
  const displayDirectories: DirectoryEntryDisplay[] = directories.map((d) => {
    const isUsed = paths.some((p) => p.endsWith(d.path))
    const isSelected = d.path === selectedPath
    const classes: string[] = []
    if (isSelected) classes.push('bg-bg-hover')
    if (isUsed) classes.push('bg-error/20')
    return { ...d, isUsed, isSelected, className: classes.join(' ') }
  })

  const displaySubdirs: DirectoryEntryDisplay[] = subdirs.map((d) => {
    const isUsed = paths.some((p) => p.endsWith(d.path))
    const classes: string[] = []
    if (isUsed) classes.push('bg-error/20')
    return { ...d, isUsed, isSelected: false, className: classes.join(' ') }
  })

  // Go back one level
  const goBack = useCallback(async () => {
    const selPath = selectedPath.replace(/^\//, '')
    const splitPaths = selPath.split('/')

    let lookupPath = ''
    let previousPath = ''

    if (splitPaths.length > 2) {
      lookupPath = splitPaths.slice(0, -2).join('/')
    }
    previousPath = splitPaths.slice(0, -1).join('/')

    if (!isPosix) {
      // For windows drives add a trailing slash, e.g. C:/
      if (lookupPath.endsWith(':')) {
        lookupPath += '/'
      }
      if (previousPath.endsWith(':')) {
        previousPath += '/'
      }
    } else {
      // Add leading slash for posix
      if (previousPath) previousPath = '/' + previousPath
      if (lookupPath) lookupPath = '/' + lookupPath
    }

    setLevel((prev) => prev - 1)
    setSubdirs(directories)
    setSelectedPath(previousPath)

    const newDirs = await fetchDirs(lookupPath, level - 1)
    setDirectories(newDirs)
  }, [selectedPath, isPosix, directories, level, fetchDirs])

  // Select a directory in the left column
  const selectDir = useCallback(
    async (dir: DirectoryEntryDisplay) => {
      if (dir.isUsed) return
      setSelectedPath(dir.path)
      setLevel(dir.level)
      const newSubdirs = await fetchDirs(dir.path, dir.level + 1)
      setSubdirs(newSubdirs)
    },
    [fetchDirs]
  )

  // Select a subdirectory in the right column
  const selectSubDir = useCallback(
    async (dir: DirectoryEntryDisplay) => {
      if (dir.isUsed) return
      setSelectedPath(dir.path)
      setLevel(dir.level)
      setDirectories(subdirs)
      const newSubdirs = await fetchDirs(dir.path, dir.level + 1)
      setSubdirs(newSubdirs)
    },
    [fetchDirs, subdirs]
  )

  // Confirm folder selection
  const selectFolder = useCallback(() => {
    if (!selectedPath) {
      console.error('No selected path')
      return
    }
    // Prevent selecting a parent directory of a folder already added
    if (paths.some((p) => p.startsWith(selectedPath))) {
      showToast('Cannot add a parent directory of a folder already added', { type: 'error' })
      return
    }
    onSelect(selectedPath)
  }, [selectedPath, paths, onSelect, showToast])

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-bg px-4 py-4">
      {/* Header */}
      <div className="flex items-center py-1 mb-2">
        <button type="button" onClick={onBack} className="material-symbols text-3xl cursor-pointer hover:text-foreground-muted transition-colors">
          arrow_back
        </button>
        <p className="px-4 text-xl">{t('HeaderChooseAFolder')}</p>
      </div>

      {/* Selected path display */}
      {rootDirs.length > 0 && (
        <div className="w-full bg-primary/70 py-1 px-4 mb-2 rounded">
          <p className="font-mono truncate">{selectedPath || '/'}</p>
        </div>
      )}

      {/* Directory browser */}
      {rootDirs.length > 0 ? (
        <div className="relative flex bg-primary/50 p-4 rounded flex-1 min-h-0">
          {/* Left column: current directories */}
          <div className="w-1/2 border-r border-bg h-full overflow-y-auto">
            {level > 0 && (
              <button type="button" className="w-full p-1 cursor-pointer flex items-center hover:bg-bg-hover text-start" onClick={goBack}>
                <span className="material-symbols fill text-yellow-200" style={{ fontSize: '1.2rem' }}>
                  folder
                </span>
                <p className="text-base font-mono px-2">..</p>
              </button>
            )}
            {displayDirectories.map((dir) => (
              <button
                type="button"
                key={dir.path}
                className={mergeClasses(
                  'w-full p-1 cursor-pointer flex items-center hover:text-foreground text-foreground-muted hover:bg-bg-hover text-start',
                  dir.className,
                  dir.isUsed && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => selectDir(dir)}
                disabled={dir.isUsed}
              >
                <span className="material-symbols fill text-yellow-200 shrink-0" style={{ fontSize: '1.2rem' }}>
                  folder
                </span>
                <p className="text-base font-mono px-2 truncate">{dir.dirname}</p>
                {dir.isSelected && (
                  <span className="material-symbols shrink-0" style={{ fontSize: '1.1rem' }}>
                    arrow_right
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right column: subdirectories */}
          <div className="w-1/2 h-full overflow-y-auto">
            {displaySubdirs.map((dir) => (
              <button
                type="button"
                key={dir.path}
                className={mergeClasses(
                  'w-full p-1 cursor-pointer flex items-center hover:text-foreground text-foreground-muted hover:bg-bg-hover text-start',
                  dir.className,
                  dir.isUsed && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => selectSubDir(dir)}
                disabled={dir.isUsed}
              >
                <span className="material-symbols fill text-yellow-200 shrink-0" style={{ fontSize: '1.2rem' }}>
                  folder
                </span>
                <p className="text-base font-mono px-2 truncate">{dir.dirname}</p>
              </button>
            ))}
          </div>

          {/* Loading overlay */}
          {loadingDirs && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/30 rounded">
              <LoadingSpinner />
            </div>
          )}
        </div>
      ) : initialLoad ? (
        <div className="py-12 text-center flex-1">
          <p>{t('MessageLoadingFolders')}</p>
        </div>
      ) : (
        <div className="py-12 text-center max-w-sm mx-auto flex-1">
          <p className="text-lg mb-2">{t('MessageNoFoldersAvailable')}</p>
          <p className="text-foreground-muted mb-2">{t('NoteFolderPicker')}</p>
        </div>
      )}

      {/* Select folder button */}
      <div className="w-full py-2 shrink-0">
        <Btn color="bg-primary" disabled={!selectedPath} className="w-full mt-2" onClick={selectFolder}>
          {t('ButtonSelectFolderPath')}
        </Btn>
      </div>
    </div>
  )
}
