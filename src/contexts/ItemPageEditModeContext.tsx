'use client'

import { createContext, useContext } from 'react'

interface ItemPageEditModeContextValue {
  isPageEditMode: boolean
}

const ItemPageEditModeContext = createContext<ItemPageEditModeContextValue>({
  isPageEditMode: false
})

export const useItemPageEditMode = () => useContext(ItemPageEditModeContext)

export const ItemPageEditModeProvider = ItemPageEditModeContext.Provider
