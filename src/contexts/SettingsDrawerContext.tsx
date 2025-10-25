'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface SettingsDrawerContextType {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const SettingsDrawerContext = createContext<SettingsDrawerContextType | undefined>(undefined)

export function SettingsDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      toggle,
      open,
      close
    }),
    [isOpen, toggle, open, close]
  )

  return <SettingsDrawerContext.Provider value={value}>{children}</SettingsDrawerContext.Provider>
}

export function useSettingsDrawer() {
  const context = useContext(SettingsDrawerContext)
  if (context === undefined) {
    throw new Error('useSettingsDrawer must be used within a SettingsDrawerProvider')
  }
  return context
}
