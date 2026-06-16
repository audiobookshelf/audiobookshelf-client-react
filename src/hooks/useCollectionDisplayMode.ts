'use client'

import { useCompilationDisplayMode, type CompilationDisplayMode } from '@/hooks/useCompilationDisplayMode'

export type CollectionDisplayMode = CompilationDisplayMode

const STORAGE_KEY = 'collectionDisplayMode'

export function useCollectionDisplayMode() {
  return useCompilationDisplayMode(STORAGE_KEY, 'bookshelf')
}
