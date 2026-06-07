'use client'

import { DEFAULT_EREADER_SETTINGS, type EreaderSettings, loadEreaderSettings, saveEreaderSettings } from '@/lib/ereader/ereaderSettings'
import { useCallback, useState } from 'react'

export function useEreaderSettings() {
  const [settings, setSettings] = useState<EreaderSettings>(() => loadEreaderSettings())

  const updateSettings = useCallback((patch: Partial<EreaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveEreaderSettings(next)
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_EREADER_SETTINGS)
    saveEreaderSettings(DEFAULT_EREADER_SETTINGS)
  }, [])

  return { settings, updateSettings, resetSettings }
}
