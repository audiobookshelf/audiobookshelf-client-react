'use client'

import { useUser } from '@/contexts/UserContext'
import { Library, User } from '@/types/api'
import { createContext, ReactNode, useContext } from 'react'

interface ComponentsCatalogContextType {
  user: User
  libraries: Library[]
  bookCoverAspectRatio: 0 | 1
}

const ComponentsCatalogContext = createContext<ComponentsCatalogContextType | undefined>(undefined)

interface ComponentsCatalogProviderProps {
  children: ReactNode
  libraries: Library[]
}

export function ComponentsCatalogProvider({ children, libraries }: ComponentsCatalogProviderProps) {
  const { user } = useUser()

  const value: ComponentsCatalogContextType = {
    user,
    libraries,
    bookCoverAspectRatio: 1
  }

  return <ComponentsCatalogContext.Provider value={value}>{children}</ComponentsCatalogContext.Provider>
}

export const useComponentsCatalog = (): ComponentsCatalogContextType => {
  const context = useContext(ComponentsCatalogContext)
  if (context === undefined) {
    throw new Error('useComponentsCatalog must be used within a ComponentsCatalogProvider')
  }
  return context
}
