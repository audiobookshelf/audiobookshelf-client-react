'use client'

import { Library, User, UserLoginResponse } from '@/types/api'
import React, { createContext, ReactNode, useContext } from 'react'

interface ComponentsCatalogContextType {
  user: User
  libraries: Library[]
  bookCoverAspectRatio: number
}

const ComponentsCatalogContext = createContext<ComponentsCatalogContextType | undefined>(undefined)

interface ComponentsCatalogProviderProps {
  children: ReactNode
  currentUser: UserLoginResponse
  libraries: Library[]
}

export const ComponentsCatalogProvider: React.FC<ComponentsCatalogProviderProps> = ({ children, currentUser, libraries }) => {
  const value: ComponentsCatalogContextType = {
    user: currentUser.user,
    libraries,
    bookCoverAspectRatio: currentUser.serverSettings?.bookshelfView || 1
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
