'use client'

import { BookshelfSelectionProvider } from '@/contexts/BookshelfSelectionContext'
import type { ReactNode } from 'react'

export default function LibrarySelectionLayout({ children }: { children: ReactNode }) {
  return <BookshelfSelectionProvider>{children}</BookshelfSelectionProvider>
}
