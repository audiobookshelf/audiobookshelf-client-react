'use client'

import { useRef, useState } from 'react'

interface DragDropProps {
  onFilesDropped: (files: File[]) => void | Promise<void>
  children?: React.ReactNode
  className?: string
  dragActiveClassName?: string
}

export default function DragDrop({ onFilesDropped, children, className = '', dragActiveClassName = 'border-primary-hover bg-primary-hover' }: DragDropProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  // drag counter is used to properly handle drag enter / leave events over child elements
  // without it, dragging over child elements would trigger drag leave on the parent (this comp) and the style would flicker
  const dragCounter = useRef(0)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }

  const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragActive(false)
    }
  }

  // handles both file and folder drops
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragActive(false)

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const items = Array.from(e.dataTransfer.items)
      const hasDirectories = items.some((item) => item.webkitGetAsEntry()?.isDirectory)

      if (hasDirectories) {
        const files = await traverseFileTree(items)
        onFilesDropped(files)
      } else {
        // Only files - convert FileList to File array to keep a common output type
        const files = Array.from(e.dataTransfer.files)
        onFilesDropped(files)
      }
    }
  }

  /**
   * Recursively traverse file tree to collect all files from dropped items
   */
  const traverseFileTree = async (items: DataTransferItem[]): Promise<File[]> => {
    const files: File[] = []

    for (const item of items) {
      const entry = item.webkitGetAsEntry()
      if (entry) {
        const entryFiles = await traverseEntry(entry)
        files.push(...entryFiles)
      }
    }

    return files
  }

  /**
   * Recursively traverse a FileSystemEntry (file or directory)
   */
  const traverseEntry = (entry: FileSystemEntry): Promise<File[]> => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry
        fileEntry.file((file) => {
          resolve([file])
        })
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry
        const dirReader = dirEntry.createReader()
        const files: File[] = []

        function readEntries(): void {
          dirReader.readEntries(async (entries) => {
            if (entries.length > 0) {
              for (const subEntry of entries) {
                const subFiles = await traverseEntry(subEntry)
                files.push(...subFiles)
              }
              readEntries()
            } else {
              resolve(files)
            }
          })
        }

        readEntries()
      } else {
        resolve([])
      }
    })
  }

  return (
    <div
      onDragOver={handleDrag}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed border-primary rounded-lg p-8 transition-colors
        ${isDragActive ? dragActiveClassName : ''}
        ${className}
      `}
      role="region"
      aria-label="File drop zone"
    >
      {children}
    </div>
  )
}
